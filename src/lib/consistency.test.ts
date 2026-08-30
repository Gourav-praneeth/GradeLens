import { describe, expect, it } from "vitest";
import { clusterDeductions, deductionFingerprint, scoreDistribution } from "./consistency";

describe("deductionFingerprint", () => {
  it("treats near-duplicate reasons as the same issue", () => {
    expect(deductionFingerprint("Missing the base case in the induction proof.")).toBe(
      deductionFingerprint("The induction proof is missing a base case."),
    );
  });
});

describe("clusterDeductions", () => {
  it("flags the same mistake with different point values", () => {
    const clusters = clusterDeductions([
      {
        submissionId: "s1",
        studentName: "Alex Chen",
        criterionId: "c1",
        criterionLabel: "Q1",
        maxPoints: 2,
        pointsAwarded: 1,
        deductionReason: "Missing the base case.",
      },
      {
        submissionId: "s2",
        studentName: "Jordan Lee",
        criterionId: "c1",
        criterionLabel: "Q1",
        maxPoints: 2,
        pointsAwarded: 0,
        deductionReason: "Missing the base case.",
      },
    ]);

    expect(clusters).toHaveLength(1);
    expect(clusters[0].inconsistent).toBe(true);
    expect(clusters[0].rows).toHaveLength(2);
  });

  it("does not flag matching deductions with the same score", () => {
    const clusters = clusterDeductions([
      {
        submissionId: "s1",
        studentName: "Alex Chen",
        criterionId: "c1",
        criterionLabel: "Q1",
        maxPoints: 2,
        pointsAwarded: 1,
        deductionReason: "Missing the base case.",
      },
      {
        submissionId: "s2",
        studentName: "Jordan Lee",
        criterionId: "c1",
        criterionLabel: "Q1",
        maxPoints: 2,
        pointsAwarded: 1,
        deductionReason: "Missing the base case.",
      },
    ]);

    expect(clusters[0].inconsistent).toBe(false);
  });
});

describe("scoreDistribution", () => {
  it("bins graded totals by percent of possible", () => {
    const bands = scoreDistribution([
      { awarded: 2, possible: 10 },
      { awarded: 6, possible: 10 },
      { awarded: 8, possible: 10 },
      { awarded: 10, possible: 10 },
    ]);
    expect(bands.map((band) => band.count)).toEqual([1, 1, 1, 1]);
  });
});
