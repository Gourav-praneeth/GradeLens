import { describe, expect, it } from "vitest";
import { validateOverride } from "./override";

describe("validateOverride", () => {
  it("requires a note when the score changes", () => {
    const result = validateOverride({
      pointsAwarded: 1.5,
      maxPoints: 1.5,
      modelPointsAwarded: 0.5,
      note: "",
    });
    expect(result.ok).toBe(false);
  });

  it("accepts a changed score with a note", () => {
    const result = validateOverride({
      pointsAwarded: 1.5,
      maxPoints: 1.5,
      modelPointsAwarded: 0.5,
      note: "Showed the speedup calculation on page 2.",
    });
    expect(result).toEqual({
      ok: true,
      pointsAwarded: 1.5,
      overrideNote: "Showed the speedup calculation on page 2.",
    });
  });

  it("clears the override when the score matches the model", () => {
    const result = validateOverride({
      pointsAwarded: 0.5,
      maxPoints: 1.5,
      modelPointsAwarded: 0.5,
      note: "",
    });
    expect(result).toEqual({ ok: true, pointsAwarded: 0.5, overrideNote: null });
  });

  it("rejects scores outside the criterion range", () => {
    expect(
      validateOverride({
        pointsAwarded: 2,
        maxPoints: 1.5,
        modelPointsAwarded: 0.5,
        note: "too high",
      }).ok,
    ).toBe(false);
  });
});
