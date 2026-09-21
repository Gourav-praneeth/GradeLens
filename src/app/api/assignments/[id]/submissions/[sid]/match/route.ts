import { NextResponse } from "next/server";
import { guardAssignment } from "@/lib/access";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string; sid: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id, sid } = await context.params;
  const access = await guardAssignment(id);
  if (!access.ok) return access.error;
  if (!access.assignment.courseId) {
    return jsonError("This assignment is not in a course.", 403);
  }

  const body = (await request.json()) as { studentId?: string };
  const studentId = String(body.studentId ?? "").trim();
  const [submission, student, duplicate] = await Promise.all([
    prisma.submission.findFirst({ where: { id: sid, assignmentId: id } }),
    prisma.student.findFirst({
      where: {
        id: studentId,
        courseId: access.assignment.courseId,
        enrollmentStatus: { not: "inactive" },
      },
    }),
    prisma.submission.findFirst({
      where: {
        assignmentId: id,
        studentId,
        id: { not: sid },
      },
    }),
  ]);
  if (!submission) return jsonError("Submission not found.", 404);
  if (!student) return jsonError("Choose an active student from this course.");
  if (duplicate) {
    return jsonError(`${student.name} already has a submission for this assignment.`);
  }

  await prisma.submission.update({
    where: { id: sid },
    data: {
      studentId: student.id,
      studentLabel: student.name,
      matchStatus: "matched",
      matchMethod: "manual",
    },
  });
  return NextResponse.json({ ok: true });
}
