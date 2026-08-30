import { NextResponse } from "next/server";
import { requireCourseAccess, requireUser } from "@/lib/access";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const access = await requireCourseAccess(auth.user.id, id);
  if (access.error) return access.error;

  const body = (await request.json()) as { name?: string; email?: string; studentNumber?: string; importText?: string };
  const importText = String(body.importText ?? "").trim();
  if (importText) {
    const names = importText
      .split(/\r?\n/)
      .map((line) => line.split(",")[0]?.trim() ?? "")
      .filter(Boolean);
    if (names.length === 0) return jsonError("Paste one student name per line.");
    const created = await prisma.$transaction(
      names.map((name) => prisma.student.create({ data: { courseId: id, name } })),
    );
    return NextResponse.json({ count: created.length });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim() || null;
  const studentNumber = String(body.studentNumber ?? "").trim() || null;
  if (!name) return jsonError("Enter the student name.");

  const student = await prisma.student.create({
    data: { courseId: id, name, email, studentNumber },
  });
  return NextResponse.json(student);
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const access = await requireCourseAccess(auth.user.id, id);
  if (access.error) return access.error;

  const body = (await request.json()) as { studentId?: string };
  const studentId = String(body.studentId ?? "");
  const student = await prisma.student.findFirst({ where: { id: studentId, courseId: id } });
  if (!student) return jsonError("Student not found.", 404);
  await prisma.student.delete({ where: { id: student.id } });
  return NextResponse.json({ ok: true });
}
