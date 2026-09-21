import { describe, expect, it } from "vitest";
import { parseRosterCsv } from "@/lib/rosterCsv";

describe("parseRosterCsv", () => {
  it("imports separate last and first names with student IDs", () => {
    const students = parseRosterCsv(
      "Last Name,First Name,Student ID\nSmith,John,123456\nPatel,Asha,123457",
    );

    expect(students).toEqual([
      {
        name: "John Smith",
        studentNumber: "123456",
        sisLoginId: null,
        canvasUserId: null,
        email: null,
      },
      {
        name: "Asha Patel",
        studentNumber: "123457",
        sisLoginId: null,
        canvasUserId: null,
        email: null,
      },
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
        sisLoginId: null,
        canvasUserId: null,
        email: "alex@example.edu",
      },
    ]);
  });

  it("accepts common case and spacing variations in headers", () => {
    const students = parseRosterCsv(
      "surname,given_name,student number,email address\nLee,Jordan,42,jordan@example.edu",
    );

    expect(students[0]).toEqual({
      name: "Jordan Lee",
      studentNumber: "42",
      sisLoginId: null,
      canvasUserId: null,
      email: "jordan@example.edu",
    });
  });

  it("imports a Canvas gradebook export and skips Points Possible", () => {
    const students = parseRosterCsv(
      'Student,ID,SIS Login ID,Section\nPoints Possible,,,\n"Abdelmalak, Marina",894602,mabdelm5,77228\n"Adam, Zaia",1059557,zadam1,74347',
    );

    expect(students).toEqual([
      {
        name: "Marina Abdelmalak",
        studentNumber: null,
        sisLoginId: "mabdelm5",
        canvasUserId: "894602",
        email: null,
      },
      {
        name: "Zaia Adam",
        studentNumber: null,
        sisLoginId: "zadam1",
        canvasUserId: "1059557",
        email: null,
      },
    ]);
  });

  it("rejects duplicate Canvas IDs", () => {
    expect(() =>
      parseRosterCsv(
        'Student,ID,SIS Login ID,Section\n"Abdelmalak, Marina",894602,mabdelm5,77228\n"Other, Student",894602,other,74347',
      ),
    ).toThrow('Canvas ID "894602" appears more than once.');
  });

  it("rejects a CSV without usable name headers", () => {
    expect(() => parseRosterCsv("Student ID,Email\n123,a@example.edu")).toThrow(
      'CSV headers must include "Name" or both "First Name" and "Last Name".',
    );
  });
});
