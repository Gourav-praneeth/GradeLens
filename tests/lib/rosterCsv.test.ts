import { describe, expect, it } from "vitest";
import { parseRosterCsv } from "@/lib/rosterCsv";

describe("parseRosterCsv", () => {
  it("imports separate last and first names with student IDs", () => {
    const students = parseRosterCsv(
      "Last Name,First Name,Student ID\nSmith,John,123456\nPatel,Asha,123457",
    );

    expect(students).toEqual([
      { name: "John Smith", studentNumber: "123456", email: null },
      { name: "Asha Patel", studentNumber: "123457", email: null },
    ]);
  });

  it("imports exported full names, quoted values, and optional emails", () => {
    const students = parseRosterCsv(
      'Name,Student ID,Email\n"Chen, Alex",S-10,alex@example.edu',
    );

    expect(students).toEqual([
      {
        name: "Chen, Alex",
        studentNumber: "S-10",
        email: "alex@example.edu",
      },
    ]);
  });

  it("accepts common case and spacing variations in headers", () => {
    const students = parseRosterCsv(
      "surname,given_name,id,email address\nLee,Jordan,42,jordan@example.edu",
    );

    expect(students[0]).toEqual({
      name: "Jordan Lee",
      studentNumber: "42",
      email: "jordan@example.edu",
    });
  });

  it("rejects a CSV without usable name headers", () => {
    expect(() => parseRosterCsv("Student ID,Email\n123,a@example.edu")).toThrow(
      'CSV headers must include "Name" or both "First Name" and "Last Name".',
    );
  });
});
