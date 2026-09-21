import { describe, expect, it } from "vitest";
import { canvasSubmissionDecision } from "@/lib/canvasSubmissionImport";

describe("canvasSubmissionDecision", () => {
  it("creates a first import", () => {
    expect(
      canvasSubmissionDecision(null, "2026-09-20T12:00:00Z"),
    ).toMatchObject({ action: "create" });
  });

  it("keeps retries idempotent", () => {
    expect(
      canvasSubmissionDecision(
        new Date("2026-09-20T12:00:00Z"),
        "2026-09-20T12:00:00Z",
      ),
    ).toMatchObject({ action: "unchanged" });
  });

  it("updates a newer Canvas resubmission", () => {
    expect(
      canvasSubmissionDecision(
        new Date("2026-09-20T12:00:00Z"),
        "2026-09-20T13:00:00Z",
      ),
    ).toMatchObject({ action: "update" });
  });
});
