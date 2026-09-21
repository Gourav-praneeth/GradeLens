import { describe, expect, it } from "vitest";
import { parseSubmissionManifest } from "@/lib/submissionManifest";

describe("parseSubmissionManifest", () => {
  it("maps filenames to SIS login IDs", () => {
    const manifest = parseSubmissionManifest(
      "filename,sis_login_id\nalex-paper.pdf,achen\njordan-paper.pdf,jlee",
    );

    expect(manifest.get("alex-paper.pdf")).toEqual({
      kind: "sisLoginId",
      value: "achen",
    });
    expect(manifest.get("jordan-paper.pdf")).toEqual({
      kind: "sisLoginId",
      value: "jlee",
    });
  });

  it("supports quoted filenames and student IDs", () => {
    const manifest = parseSubmissionManifest(
      'file name,student_id\n"Smith, Alex.pdf",S-100',
    );

    expect(manifest.get("smith, alex.pdf")).toEqual({
      kind: "studentNumber",
      value: "S-100",
    });
  });

  it("supports Canvas user IDs as a fallback manifest key", () => {
    const manifest = parseSubmissionManifest(
      "filename,canvas_user_id\npaper.pdf,894602",
    );

    expect(manifest.get("paper.pdf")).toEqual({
      kind: "canvasUserId",
      value: "894602",
    });
  });

  it("rejects duplicate filenames", () => {
    expect(() =>
      parseSubmissionManifest(
        "filename,email\npaper.pdf,a@school.edu\nPAPER.PDF,b@school.edu",
      ),
    ).toThrow('Manifest lists "PAPER.PDF" more than once.');
  });
});
