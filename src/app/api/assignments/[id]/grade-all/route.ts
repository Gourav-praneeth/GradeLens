import { NextResponse } from "next/server";
import { guardAssignment } from "@/lib/access";
import { prisma } from "@/lib/db";
import { runGrading } from "@/lib/grading";
import { llmUserMessage } from "@/lib/errors";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 120;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await guardAssignment(id);
  if (!access.ok) return access.error;
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: { rubric: true },
  });
  if (!assignment) {
    return jsonError("Assignment not found.", 404);
  }
  if (!assignment.rubric) {
    return jsonError("Generate and save a rubric before grading.");
  }

  const pending = await prisma.submission.findMany({
    where: {
      assignmentId: id,
      status: { in: ["uploaded", "failed"] },
      extractedText: { not: "" },
    },
    orderBy: { createdAt: "asc" },
  });

  if (pending.length === 0) {
    return jsonError("No ungraded submissions with extractable text.");
  }

  const errors: string[] = [];
  let graded = 0;

  for (const submission of pending) {
    try {
      await runGrading(submission.id, access.user.id);
      graded += 1;
    } catch (error) {
      const message = llmUserMessage(error);
      errors.push(`${submission.studentLabel}: ${message}`);
    }
  }

  return NextResponse.json({ graded, errors });
}
