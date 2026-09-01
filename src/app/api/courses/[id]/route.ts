import { NextResponse } from "next/server";
import { isOwner, requireCourseAccess, requireUser } from "@/lib/access";
import { COURSE_ACCENTS, isValidCourseAccent, isValidSemester } from "@/lib/courseOptions";
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
    return jsonError("Only the course instructor can change course settings.", 403);
  }
  const currentCourse = await prisma.course.findUnique({
    where: { id },
    select: { semester: true },
  });
  if (!currentCourse) return jsonError("Course not found.", 404);

  const body = (await request.json()) as {
    name?: string;
    code?: string;
    semester?: string;
    description?: string;
    accent?: string;
    status?: string;
  };
  const name = String(body.name ?? "").trim();
  const semester = String(body.semester ?? "").trim() || null;
  const accent = String(body.accent ?? "").trim() || COURSE_ACCENTS[0].value;
  if (!name) return jsonError("Give the course a name.");
  if (semester && !isValidSemester(semester) && semester !== currentCourse.semester) {
    return jsonError("Choose a semester from the list.");
  }
  if (!isValidCourseAccent(accent)) {
    return jsonError("Choose a valid course color.");
  }

  const course = await prisma.course.update({
    where: { id },
    data: {
      name,
      code: String(body.code ?? "").trim() || null,
      semester,
      description: String(body.description ?? "").trim(),
      accent,
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
    return jsonError("Only the course instructor can delete this course.", 403);
  }
  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
