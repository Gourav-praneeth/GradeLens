import { describe, expect, it } from "vitest";
import { assembleGradeScores, cleanRubricCriteria } from "./rubricDraft";

describe("cleanRubricCriteria", () => {
  it("drops incomplete rows", () => {
    const cleaned = cleanRubricCriteria([
      { label: "Base case", maxPoints: 4, fullCreditDescription: "Handles n <= 1." },
      { label: "", maxPoints: 2, fullCreditDescription: "Missing label" },
      { label: "Bad", maxPoints: 0, fullCreditDescription: "Zero" },
    ]);
    expect(cleaned).toHaveLength(1);
    expect(cleaned[0]?.label).toBe("Base case");
  });
});

describe("assembleGradeScores", () => {
  const criteria = [
    { id: "c1", maxPoints: 0.5 },
    { id: "c2", maxPoints: 1.5 },
  ];

  it("clamps scores to the criterion range", () => {
    const scores = assembleGradeScores(criteria, [
      { criterionId: "c1", pointsAwarded: 9, deductionReason: "too high", evidenceQuote: "x" },
      { criterionId: "c2", pointsAwarded: -2, deductionReason: "too low", evidenceQuote: "" },
    ]);
    expect(scores.map((row) => row.pointsAwarded)).toEqual([0.5, 0]);
  });

  it("fills missing criteria with zero", () => {
    const scores = assembleGradeScores(criteria, []);
    expect(scores).toHaveLength(2);
    expect(scores[0]?.deductionReason).toMatch(/No rationale/);
  });
});
