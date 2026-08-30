import type { GradeDraftScore, RubricDraftCriterion } from "./types";

type JsonObject = Record<string, unknown>;

export function cleanRubricCriteria(raw: unknown): RubricDraftCriterion[] {
  const criteria = Array.isArray(raw) ? raw : [];
  return criteria.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as JsonObject;
    const label = String(row.label ?? "").trim();
    const maxPoints = Number(row.maxPoints);
    const fullCreditDescription = String(row.fullCreditDescription ?? "").trim();
    if (!label || !Number.isFinite(maxPoints) || maxPoints <= 0 || !fullCreditDescription) {
      return [];
    }
    return [{ label, maxPoints, fullCreditDescription }];
  });
}

export function assembleGradeScores(
  criteria: Array<{ id: string; maxPoints: number }>,
  scoresRaw: unknown,
): GradeDraftScore[] {
  const rows = Array.isArray(scoresRaw) ? scoresRaw : [];
  return criteria.map((criterion) => {
    const match = rows.find((item) => {
      if (!item || typeof item !== "object") return false;
      return String((item as JsonObject).criterionId) === criterion.id;
    }) as JsonObject | undefined;

    const awarded = Number(match?.pointsAwarded);
    const clamped = Number.isFinite(awarded)
      ? Math.min(criterion.maxPoints, Math.max(0, awarded))
      : 0;

    return {
      criterionId: criterion.id,
      pointsAwarded: clamped,
      deductionReason: String(match?.deductionReason ?? "No rationale returned.").trim(),
      evidenceQuote: String(match?.evidenceQuote ?? "").trim(),
    };
  });
}
