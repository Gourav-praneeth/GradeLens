import { NextResponse } from "next/server";
import { guardAssignment } from "@/lib/access";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { validateOverride } from "@/lib/override";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string; sid: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id, sid } = await context.params;
  const access = await guardAssignment(id);
  if (!access.ok) return access.error;
  const body = (await request.json()) as {
    scoreId?: string;
    pointsAwarded?: number;
    overrideNote?: string;
  };

  const score = await prisma.criterionScore.findFirst({
    where: {
      id: String(body.scoreId ?? ""),
      gradeResult: { submissionId: sid, submission: { assignmentId: id } },
    },
    include: { criterion: true, gradeResult: true },
  });

  if (!score) {
    return jsonError("Score not found.", 404);
  }

  const result = validateOverride({
    pointsAwarded: Number(body.pointsAwarded),
    maxPoints: score.criterion.maxPoints,
    modelPointsAwarded: score.modelPointsAwarded,
    note: String(body.overrideNote ?? ""),
  });

  if (!result.ok) {
    return jsonError(result.error);
  }

  await prisma.$transaction(async (tx) => {
    await tx.criterionScore.update({
      where: { id: score.id },
      data: {
        pointsAwarded: result.pointsAwarded,
        overrideNote: result.overrideNote,
      },
    });

    const scores = await tx.criterionScore.findMany({
      where: { gradeResultId: score.gradeResultId },
    });
    const totalAwarded = scores.reduce((sum, row) => sum + row.pointsAwarded, 0);
    await tx.gradeResult.update({
      where: { id: score.gradeResultId },
      data: { totalAwarded },
    });
  });

  return NextResponse.json({ ok: true });
}
