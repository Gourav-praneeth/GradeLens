import { describe, expect, it } from "vitest";
import { isValidEmail, normalizeEmail, normalizePersonName } from "@/lib/identity";
import { matchRosterStudent } from "@/lib/roster";

describe("identity", () => {
  it("normalizes email addresses", () => {
    expect(normalizeEmail("  TA@School.EDU ")).toBe("ta@school.edu");
    expect(isValidEmail("ta@school.edu")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
  });

  it("matches a filename to a roster name", () => {
    const roster = [
      { id: "1", name: "Alex Chen" },
      { id: "2", name: "Jordan Lee" },
    ];
    expect(matchRosterStudent("alex-chen.txt", roster)?.id).toBe("1");
    expect(matchRosterStudent("Nidhi Kamat", roster)).toBeNull();
  });

  it("normalizes person names", () => {
    expect(normalizePersonName("Alex_Chen")).toBe("alex chen");
  });
});
