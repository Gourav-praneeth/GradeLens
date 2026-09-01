import { describe, expect, it } from "vitest";
import { HELP_SECTIONS } from "@/lib/helpContent";

const REQUIRED_FIELD_IDS = [
  "account-name",
  "account-email",
  "account-password",
  "account-invite-code",
  "account-remember",
  "account-new-password",
  "account-provider",
  "account-api-key",
  "course-name",
  "course-code",
  "course-semester",
  "course-description",
  "course-color",
  "course-status",
  "roster-student-name",
  "roster-student-id",
  "roster-student-email",
  "roster-import",
  "roster-search",
  "roster-sort",
  "staff-ta-email",
  "assignment-title",
  "assignment-course",
  "assignment-description",
  "assignment-due",
  "assignment-questions-text",
  "assignment-questions-file",
  "assignment-solutions-text",
  "assignment-solutions-file",
  "rubric-criterion",
  "rubric-points",
  "rubric-full-credit",
  "submission-student",
  "submission-student-name",
  "submission-files",
  "grading-override-points",
  "grading-override-note",
  "dashboard-course-search",
  "feedback-message",
  "feedback-page",
  "export-format",
];

describe("help field guide", () => {
  it("documents every current user-facing field", () => {
    const ids = HELP_SECTIONS.flatMap((section) => section.fields.map((field) => field.id));

    expect(ids.sort()).toEqual([...REQUIRED_FIELD_IDS].sort());
  });

  it("uses unique anchors and complete field descriptions", () => {
    const sectionIds = HELP_SECTIONS.map((section) => section.id);
    const fields = HELP_SECTIONS.flatMap((section) => section.fields);
    const fieldIds = fields.map((field) => field.id);

    expect(new Set(sectionIds).size).toBe(sectionIds.length);
    expect(new Set(fieldIds).size).toBe(fieldIds.length);
    for (const section of HELP_SECTIONS) {
      expect(section.title.trim()).not.toBe("");
      expect(section.summary.trim()).not.toBe("");
      expect(section.fields.length).toBeGreaterThan(0);
    }
    for (const field of fields) {
      expect(field.label.trim()).not.toBe("");
      expect(field.description.trim()).not.toBe("");
    }
  });
});
