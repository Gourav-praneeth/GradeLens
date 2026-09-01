import { describe, expect, it } from "vitest";
import { assignmentPathState, coursePathState, isCoursesHome, isNewAssignment } from "@/lib/nav";

describe("nav", () => {
  it("marks courses home", () => {
    expect(isCoursesHome("/")).toBe(true);
    expect(isCoursesHome("/courses")).toBe(true);
  });

  it("marks the new assignment page", () => {
    expect(isNewAssignment("/assignments/new")).toBe(true);
  });

  it("marks a course page", () => {
    expect(coursePathState("/courses/abc", "abc")).toBe(true);
    expect(coursePathState("/courses/other", "abc")).toBe(false);
  });

  it("distinguishes overview from submissions", () => {
    const id = "abc";
    expect(assignmentPathState("/assignments/abc", id)).toEqual({
      onAssignment: true,
      onOverview: true,
      onSubmissions: false,
      onReview: false,
    });
    expect(assignmentPathState("/assignments/abc/submissions", id).onSubmissions).toBe(true);
    expect(assignmentPathState("/assignments/abc/submissions/sid", id).onSubmissions).toBe(true);
    expect(assignmentPathState("/assignments/abc/review", id).onReview).toBe(true);
    expect(assignmentPathState("/assignments/other", id).onAssignment).toBe(false);
  });
});
