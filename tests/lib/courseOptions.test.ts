import { describe, expect, it } from "vitest";
import {
  COURSE_ACCENTS,
  courseMonogram,
  courseRoleLabel,
  courseRoleSummary,
  isValidCourseAccent,
  isValidSemester,
  semesterOptions,
} from "@/lib/courseOptions";

describe("course roles", () => {
  it("uses user-facing role names", () => {
    expect(courseRoleLabel("owner")).toBe("Instructor");
    expect(courseRoleLabel("ta")).toBe("TA");
  });

  it("summarizes single and mixed course roles", () => {
    expect(courseRoleSummary([])).toBeNull();
    expect(courseRoleSummary(["owner"])).toBe("Your role: Instructor");
    expect(courseRoleSummary(["ta", "ta"])).toBe("Your role: TA in 2 courses");
    expect(courseRoleSummary(["owner", "owner", "ta"])).toBe(
      "Your roles: Instructor in 2 courses · TA in 1 course",
    );
  });

  it("builds a compact course monogram", () => {
    expect(courseMonogram("Computer Organization")).toBe("CO");
    expect(courseMonogram("Calculus")).toBe("CA");
  });
});

describe("semester options", () => {
  it("generates four terms for six nearby years", () => {
    const options = semesterOptions(new Date("2026-08-31T12:00:00Z"));

    expect(options).toHaveLength(24);
    expect(options).toContain("Spring 2025");
    expect(options).toContain("Fall 2026");
    expect(options).toContain("Winter 2030");
  });

  it("accepts durable term and year values", () => {
    expect(isValidSemester("Fall 2026")).toBe(true);
    expect(isValidSemester("Autumn 2026")).toBe(false);
    expect(isValidSemester("Fall 26")).toBe(false);
    expect(isValidSemester("Fall 2200")).toBe(false);
  });
});

describe("course accents", () => {
  it("uses unique, valid colors with readable white text", () => {
    const colors = COURSE_ACCENTS.map((accent) => accent.value);

    expect(new Set(colors).size).toBe(colors.length);
    for (const color of colors) {
      expect(isValidCourseAccent(color)).toBe(true);
      expect(contrastRatio(color, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("rejects unsafe CSS values", () => {
    expect(isValidCourseAccent("#2457D6")).toBe(true);
    expect(isValidCourseAccent("red")).toBe(false);
    expect(isValidCourseAccent("url(example.com)")).toBe(false);
  });
});

function contrastRatio(first: string, second: string): number {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
