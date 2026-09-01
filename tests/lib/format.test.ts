import { describe, expect, it } from "vitest";
import { formatPoints, formatScore, assignmentStatusLabel } from "@/lib/format";

describe("formatPoints", () => {
  it("keeps integers as integers", () => {
    expect(formatPoints(10)).toBe("10");
  });

  it("keeps one decimal for half points", () => {
    expect(formatPoints(0.5)).toBe("0.5");
    expect(formatPoints(1.5)).toBe("1.5");
  });
});

describe("formatScore", () => {
  it("formats awarded over possible", () => {
    expect(formatScore(0.5, 3)).toBe("0.5 / 3");
  });
});

describe("assignmentStatusLabel", () => {
  it("reports a ready rubric", () => {
    expect(assignmentStatusLabel("draft", true)).toBe("Rubric ready");
  });

  it("reports a missing rubric", () => {
    expect(assignmentStatusLabel("draft", false)).toBe("Needs rubric");
  });
});
