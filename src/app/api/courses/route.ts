import { NextResponse } from "next/server";
import { requireUser } from "@/lib/access";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const memberships = await prisma.courseMember.findMany({
    where: { userId: auth.user.id },
    include: {
      course: {
        include: {
          _count: { select: { assignments: true, students: true, members: true } },
        },
      },
    },
    orderBy: { course: { name: "asc" } },
  });

  return NextResponse.json(memberships.map((row) => ({ ...row.course, role: row.role })));
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = (await request.json()) as { name?: string; code?: string; semester?: string; description?: string; accent?: string };
  const name = String(body.name ?? "").trim();
  const code = String(body.code ?? "").trim() || null;
  const semester = String(body.semester ?? "").trim() || null;
  const description = String(body.description ?? "").trim();
  const accent = String(body.accent ?? "").trim() || "#1c4d4a";
  if (!name) return jsonError("Give the course a name.");

  const course = await prisma.course.create({
    data: {
      name,
      code,
      semester,
      description,
      accent,
      members: { create: { userId: auth.user.id, role: "owner" } },
    },
  });
  return NextResponse.json(course);
}
