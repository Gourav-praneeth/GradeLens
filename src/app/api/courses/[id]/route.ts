import { NextResponse } from "next/server";
import { isOwner, requireCourseAccess, requireUser } from "@/lib/access";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const access = await requireCourseAccess(auth.user.id, id);
  if (access.error) return access.error;
  if (!isOwner(access.member.role)) {
    return jsonError("Only the course owner can change course settings.", 403);
  }

  const body = (await request.json()) as {
    name?: string;
    code?: string;
    semester?: string;
    description?: string;
    accent?: string;
    status?: string;
  };
  const name = String(body.name ?? "").trim();
  if (!name) return jsonError("Give the course a name.");

  const course = await prisma.course.update({
    where: { id },
    data: {
      name,
      code: String(body.code ?? "").trim() || null,
      semester: String(body.semester ?? "").trim() || null,
      description: String(body.description ?? "").trim(),
      accent: String(body.accent ?? "").trim() || "#1c4d4a",
      status: body.status === "archived" ? "archived" : "active",
    },
  });
  return NextResponse.json(course);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const access = await requireCourseAccess(auth.user.id, id);
  if (access.error) return access.error;
  if (!isOwner(access.member.role)) {
    return jsonError("Only the course owner can delete this course.", 403);
  }
  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
