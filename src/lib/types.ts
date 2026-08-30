export type RubricDraftCriterion = {
  label: string;
  maxPoints: number;
  fullCreditDescription: string;
};

export type GradeDraftScore = {
  criterionId: string;
  pointsAwarded: number;
  deductionReason: string;
  evidenceQuote: string;
};
