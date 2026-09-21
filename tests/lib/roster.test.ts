import { describe, expect, it } from "vitest";
import {
  matchRosterStudent,
  matchSubmissionToRoster,
  studentDisplayName,
} from "@/lib/roster";

describe("matchRosterStudent", () => {
  const roster = [
    { id: "1", name: "Alex Chen" },
    { id: "2", name: "Jordan Lee" },
  ];

  it("matches a slug filename to a roster name", () => {
    expect(matchRosterStudent("alex-chen.txt", roster)?.id).toBe("1");
    expect(matchRosterStudent("Jordan_Lee.pdf", roster)?.name).toBe("Jordan Lee");
  });

  it("returns null when the name is not on the roster", () => {
    expect(matchRosterStudent("sam-patel.pdf", roster)).toBeNull();
  });
});

describe("matchSubmissionToRoster", () => {
  const roster = [
    {
      id: "1",
      name: "Alex Chen",
      email: "alex@school.edu",
      studentNumber: "S-100",
      sisLoginId: "achen",
    },
    {
      id: "2",
      name: "Jordan Lee",
      email: "jordan@school.edu",
      studentNumber: "S-101",
      sisLoginId: "jlee",
    },
  ];

  it("matches the deterministic SIS login filename convention", () => {
    expect(matchSubmissionToRoster({ filename: "achen__homework-1.pdf" }, roster)).toMatchObject({
      status: "matched",
      student: { id: "1" },
      method: "sis_login",
    });
  });

  it("uses an explicit manifest identity before the filename", () => {
    expect(
      matchSubmissionToRoster(
        {
          filename: "unknown.pdf",
          explicit: { kind: "studentNumber", value: "S-101" },
        },
        roster,
      ),
    ).toMatchObject({
      status: "matched",
      student: { id: "2" },
      method: "manifest_student_id",
    });
  });

  it("reports duplicate names as ambiguous instead of picking the first", () => {
    const result = matchSubmissionToRoster(
      { filename: "Alex-Chen.pdf" },
      [...roster, { ...roster[0], id: "3", sisLoginId: "achen2" }],
    );

    expect(result).toMatchObject({ status: "ambiguous", method: "name" });
    if (result.status === "ambiguous") expect(result.candidates).toHaveLength(2);
  });

  it("does not match arbitrary identifier fragments", () => {
    expect(
      matchSubmissionToRoster({ filename: "paper-S-100-final.pdf" }, roster),
    ).toEqual({ status: "unmatched", candidates: [] });
  });
});

describe("studentDisplayName", () => {
  it("prefers the roster name", () => {
    expect(studentDisplayName({ studentLabel: "alex-chen", student: { name: "Alex Chen" } })).toBe(
      "Alex Chen",
    );
  });
});
