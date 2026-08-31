import { describe, expect, it } from "vitest";
import { isFeedbackAdminEmail } from "./siteOperator";

describe("isFeedbackAdminEmail", () => {
  it("matches the configured operator email", () => {
    expect(isFeedbackAdminEmail("you@school.edu", "you@school.edu")).toBe(true);
    expect(isFeedbackAdminEmail("You@School.edu", "you@school.edu")).toBe(true);
  });

  it("rejects other emails and an empty setting", () => {
    expect(isFeedbackAdminEmail("ta@school.edu", "you@school.edu")).toBe(false);
    expect(isFeedbackAdminEmail("you@school.edu", "")).toBe(false);
    expect(isFeedbackAdminEmail("you@school.edu", undefined)).toBe(false);
  });
});
