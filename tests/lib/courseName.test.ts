import { describe, expect, it } from "vitest";
import { courseDisplayName } from "@/lib/courseName";

describe("courseDisplayName", () => {
  it("prefers the course code", () => {
    expect(courseDisplayName({ course: { name: "Computer Organization", code: "CSE230" } })).toBe("CSE230");
  });

  it("falls back to the legacy label", () => {
    expect(courseDisplayName({ courseLabel: "CS 61A" })).toBe("CS 61A");
  });
});
