import { describe, expect, it } from "vitest";
import { buildCanvasCsv, buildGradescopeCsv, parseExportFormat, splitPersonName } from "@/lib/lmsExport";

describe("parseExportFormat", () => {
  it("defaults to the GradeLens roster", () => {
    expect(parseExportFormat(null)).toBe("gradelens");
    expect(parseExportFormat("canvas")).toBe("canvas");
  });
});

describe("splitPersonName", () => {
  it("puts the last token in Last Name", () => {
    expect(splitPersonName("Alex Chen")).toEqual({ first: "Alex", last: "Chen" });
  });
});

describe("LMS csv", () => {
  const rows = [
    { name: "Alex Chen", email: "alex@school.edu", awarded: 2.5, possible: 3, status: "graded" },
  ];

  it("builds a Canvas gradebook-style file", () => {
    const csv = buildCanvasCsv("Assignment 1", 3, rows);
    expect(csv.split("\n")[0]).toContain("SIS Login ID");
    expect(csv).toContain("Points Possible,,,,,3");
    expect(csv).toContain("Alex Chen,,,alex@school.edu,,2.5");
  });

  it("builds a Gradescope-style file", () => {
    const csv = buildGradescopeCsv(rows);
    expect(csv.split("\n")[0]).toBe("First Name,Last Name,SID,Email,Total Score,Status");
    expect(csv).toContain("Alex,Chen,,alex@school.edu,2.5,graded");
  });
});
