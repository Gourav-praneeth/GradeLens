import { describe, expect, it } from "vitest";
import { buildRosterCsv, csvCell } from "@/lib/csv";

describe("csvCell", () => {
  it("quotes commas and quotes", () => {
    expect(csvCell('Chen, Alex')).toBe('"Chen, Alex"');
    expect(csvCell('He said "ok"')).toBe('"He said ""ok"""');
  });
});

describe("buildRosterCsv", () => {
  it("includes student, total, and per-criterion scores", () => {
    const csv = buildRosterCsv(
      [
        { id: "c1", label: "Q1 (a)" },
        { id: "c2", label: "Q1 (b)" },
      ],
      [
        {
          studentLabel: "Alex Chen",
          originalName: "alex.txt",
          status: "graded",
          awarded: 2,
          possible: 3,
          scores: [
            { criterionId: "c1", pointsAwarded: 0.5 },
            { criterionId: "c2", pointsAwarded: 1.5 },
          ],
        },
      ],
    );

    expect(csv.split("\n")[0]).toBe("Student,File,Status,Awarded,Possible,Q1 (a),Q1 (b)");
    expect(csv).toContain("Alex Chen,alex.txt,graded,2,3,0.5,1.5");
  });
});
