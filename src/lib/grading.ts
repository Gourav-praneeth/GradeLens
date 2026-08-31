import { prisma } from "./db";
import { gradeSubmission } from "./llm";
import { resolveLlmCredentials } from "./llmKeys";

export async function runGrading(submissionId: string, userId: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        include: {
          rubric: {
            include: {
              criteria: { orderBy: { sortOrder: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!submission) {
    throw new Error("Submission not found.");
  }

  const criteria = submission.assignment.rubric?.criteria ?? [];
  if (criteria.length === 0) {
    throw new Error("Generate and save a rubric before grading.");
  }

  if (!submission.extractedText.trim()) {
    throw new Error(
      submission.extractWarning ??
        "This submission has no extractable text, so it cannot be graded yet.",
    );
  }

  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: "grading" },
  });

  try {
    const credentials = await resolveLlmCredentials(userId);
    const draft = await gradeSubmission(
      {
        title: submission.assignment.title,
        questionsText: submission.assignment.questionsText,
        solutionsText: submission.assignment.solutionsText,
        studentText: submission.extractedText,
        criteria: criteria.map((criterion) => ({
          id: criterion.id,
          label: criterion.label,
          maxPoints: criterion.maxPoints,
          fullCreditDescription: criterion.fullCreditDescription,
        })),
      },
      credentials,
    );

    const totalAwarded = draft.scores.reduce((sum, score) => sum + score.pointsAwarded, 0);
    const totalPossible = criteria.reduce((sum, criterion) => sum + criterion.maxPoints, 0);

    await prisma.$transaction(async (tx) => {
      await tx.gradeResult.deleteMany({ where: { submissionId } });
      await tx.gradeResult.create({
        data: {
          submissionId,
          totalAwarded,
          totalPossible,
          summary: draft.summary,
          scores: {
            create: draft.scores.map((score) => ({
              criterionId: score.criterionId,
              pointsAwarded: score.pointsAwarded,
              modelPointsAwarded: score.pointsAwarded,
              overrideNote: null,
              deductionReason: score.deductionReason,
              evidenceQuote: score.evidenceQuote || null,
            })),
          },
        },
      });
      await tx.submission.update({
        where: { id: submissionId },
        data: { status: "graded" },
      });
    });
  } catch (error) {
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "failed" },
    });
    throw error;
  }
}
