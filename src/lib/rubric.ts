import { prisma } from "./db";
import type { RubricDraftCriterion } from "./types";

export async function replaceRubric(
  assignmentId: string,
  criteria: RubricDraftCriterion[],
) {
  await prisma.$transaction(async (tx) => {
    await tx.gradeResult.deleteMany({
      where: { submission: { assignmentId } },
    });
    await tx.submission.updateMany({
      where: { assignmentId },
      data: { status: "uploaded" },
    });
    await tx.rubric.deleteMany({ where: { assignmentId } });
    await tx.rubric.create({
      data: {
        assignmentId,
        criteria: {
          create: criteria.map((criterion, index) => ({
            label: criterion.label,
            maxPoints: criterion.maxPoints,
            fullCreditDescription: criterion.fullCreditDescription,
            sortOrder: index,
          })),
        },
      },
    });
    await tx.assignment.update({
      where: { id: assignmentId },
      data: { status: "ready" },
    });
  });
}
