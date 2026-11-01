import { NextResponse } from "next/server";
import { guardAssignment } from "@/lib/access";
import { prisma } from "@/lib/db";
import { runGrading } from "@/lib/grading";
import { llmUserMessage } from "@/lib/errors";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 120;

type RouteContext = { params: Promise<{ id: string }> };

function boundedSetting(value: string | undefined, fallback: number, maximum: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

async function gradeBatch(
  submissions: Array<{ id: string; studentLabel: string }>,
  userId: string,
  concurrency: number,
) {
  const outcomes: Array<{ studentLabel: string; error: string | null }> = [];
  for (let offset = 0; offset < submissions.length; offset += concurrency) {
    const group = submissions.slice(offset, offset + concurrency);
    outcomes.push(
      ...(await Promise.all(
        group.map(async (submission) => {
          try {
            await runGrading(submission.id, userId);
            return { studentLabel: submission.studentLabel, error: null };
          } catch (error) {
            return { studentLabel: submission.studentLabel, error: llmUserMessage(error) };
          }
        }),
      )),
    );
  }
  return outcomes;
}

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
      studentId: { not: null },
      matchStatus: "matched",
      status: { in: ["uploaded", "failed"] },
      extractedText: { not: "" },
    },
    orderBy: { createdAt: "asc" },
    take: boundedSetting(process.env.GRADING_BATCH_SIZE, 4, 10),
  });

  if (pending.length === 0) {
    const unresolved = await prisma.submission.count({
      where: { assignmentId: id, matchStatus: { not: "matched" } },
    });
    return jsonError(
      unresolved > 0
        ? `${unresolved} submissions need a student match before bulk grading.`
        : "No ungraded submissions with extractable text.",
    );
  }

  const outcomes = await gradeBatch(
    pending,
    access.user.id,
    boundedSetting(process.env.GRADING_CONCURRENCY, 2, 4),
  );
  const graded = outcomes.filter((outcome) => !outcome.error).length;
  const errors = outcomes.flatMap((outcome) =>
    outcome.error ? [`${outcome.studentLabel}: ${outcome.error}`] : [],
  );

  const unresolved = await prisma.submission.count({
    where: { assignmentId: id, matchStatus: { not: "matched" } },
  });
  const remaining = await prisma.submission.count({
    where: {
      assignmentId: id,
      studentId: { not: null },
      matchStatus: "matched",
      status: { in: ["uploaded", "failed"] },
      extractedText: { not: "" },
    },
  });
  return NextResponse.json({ graded, errors, unresolved, remaining });
}
