import { describe, expect, it } from "vitest";
import { assignmentLifecycle } from "./assignmentStatus";

describe("assignmentLifecycle", () => {
  it("treats a saved rubric as published", () => {
    expect(assignmentLifecycle({ hasRubric: true, dueAt: new Date("2099-01-01") })).toBe("published");
  });

  it("marks past due dates as closed", () => {
    expect(assignmentLifecycle({ hasRubric: true, dueAt: new Date("2000-01-01") })).toBe("closed");
  });

  it("stays draft without a rubric", () => {
    expect(assignmentLifecycle({ hasRubric: false })).toBe("draft");
  });
});
