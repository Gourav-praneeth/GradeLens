import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { applyStatedPoints, parseStatedPoints, statedPointsPromptBlock } from "./points";

const CSE230 = `CSE 230 – Assignment 1
Important: This is an individual assignment. Please do not collaborate.
There are 2 questions worth a total of 3 points.
Question 1:
A technology company is evaluating two processors.
(a) Compare the performance of the two processors. (0.5 points)
(b) Determine the clock frequency after the ISA modification. (1.5 points)
Question 2:
A development team is testing a processor.
(a) Determine the average number of clock cycles per instruction. (0.5 points)
(b) Determine the performance of the processor. (0.5 points)
`;

describe("parseStatedPoints", () => {
  it("reads CSE 230 part scores and the stated total", () => {
    const stated = parseStatedPoints(CSE230);
    expect(stated.statedTotal).toBe(3);
    expect(stated.parts).toEqual([
      { label: "Q1 (a)", maxPoints: 0.5 },
      { label: "Q1 (b)", maxPoints: 1.5 },
      { label: "Q2 (a)", maxPoints: 0.5 },
      { label: "Q2 (b)", maxPoints: 0.5 },
    ]);
    expect(stated.parts.reduce((sum, part) => sum + part.maxPoints, 0)).toBe(3);
  });

  it("reads the uploaded CSE 230 Assignment 1 PDF text", () => {
    const full = readFileSync(path.join(__dirname, "fixtures/cse230-assignment1.txt"), "utf8");
    const stated = parseStatedPoints(full);
    expect(stated.statedTotal).toBe(3);
    expect(stated.parts.map((part) => part.maxPoints)).toEqual([0.5, 1.5, 0.5, 0.5]);
  });

  it("reads whole-question point values", () => {
    const stated = parseStatedPoints("Q1. Derive the recurrence (10 points)\nQ2. Solve it (15 pts)");
    expect(stated.parts).toEqual([
      { label: "Q1", maxPoints: 10 },
      { label: "Q2", maxPoints: 15 },
    ]);
  });

  it("returns empty parts when no scores are listed", () => {
    const stated = parseStatedPoints("Q1. Write a factorial function.\nQ2. State the base case.");
    expect(stated.parts).toEqual([]);
    expect(stated.statedTotal).toBeNull();
  });
});

describe("applyStatedPoints", () => {
  it("overwrites a 10-point invented rubric with the CSE 230 scores", () => {
    const stated = parseStatedPoints(CSE230);
    const result = applyStatedPoints(
      [
        { label: "Q1a – Processor comparison", maxPoints: 2, fullCreditDescription: "Compare Alpha and Beta." },
        { label: "Q1b – Clock frequencies", maxPoints: 5, fullCreditDescription: "Find both frequencies." },
        { label: "Q2a – Average CPI", maxPoints: 2, fullCreditDescription: "Compute CPI." },
        { label: "Q2b – Performance", maxPoints: 1, fullCreditDescription: "Compute performance." },
      ],
      stated,
    );

    expect(result.map((row) => row.maxPoints)).toEqual([0.5, 1.5, 0.5, 0.5]);
    expect(result.reduce((sum, row) => sum + row.maxPoints, 0)).toBe(3);
    expect(result[0]?.fullCreditDescription).toContain("Compare Alpha");
  });

  it("rebuilds from stated parts when the model returns the wrong number of rows", () => {
    const stated = parseStatedPoints(CSE230);
    const result = applyStatedPoints(
      [{ label: "Everything", maxPoints: 10, fullCreditDescription: "Do the assignment." }],
      stated,
    );
    expect(result).toHaveLength(4);
    expect(result.map((row) => row.maxPoints)).toEqual([0.5, 1.5, 0.5, 0.5]);
  });

  it("scales to a stated total when only the total is known", () => {
    const result = applyStatedPoints(
      [
        { label: "A", maxPoints: 6, fullCreditDescription: "A" },
        { label: "B", maxPoints: 4, fullCreditDescription: "B" },
      ],
      { parts: [], statedTotal: 5 },
    );
    expect(result.map((row) => row.maxPoints)).toEqual([3, 2]);
  });
});

describe("statedPointsPromptBlock", () => {
  it("lists the parsed CSE 230 scores for the model", () => {
    const block = statedPointsPromptBlock(parseStatedPoints(CSE230));
    expect(block).toContain("Q1 (a): 0.5 points");
    expect(block).toContain("Assignment total: 3 points");
    expect(block).toContain("Do not round to 10, 20, 50, or 100");
  });
});
