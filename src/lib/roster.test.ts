import { describe, expect, it } from "vitest";
import { matchRosterStudent, studentDisplayName } from "./roster";

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

describe("studentDisplayName", () => {
  it("prefers the roster name", () => {
    expect(studentDisplayName({ studentLabel: "alex-chen", student: { name: "Alex Chen" } })).toBe(
      "Alex Chen",
    );
  });
});
