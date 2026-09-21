import { describe, expect, it } from "vitest";
import { planCanvasRosterSync } from "@/lib/canvasSync";

describe("planCanvasRosterSync", () => {
  it("matches by Canvas ID, then student ID, then email", () => {
    const plan = planCanvasRosterSync(
      [
        student({
          id: "canvas-match",
          name: "Alex Chen",
          email: "alex@school.edu",
          studentNumber: "S-1",
          canvasUserId: "101",
          rosterSource: "canvas",
        }),
        student({
          id: "student-id-match",
          name: "Old Jordan",
          email: null,
          studentNumber: "S-2",
        }),
        student({
          id: "email-match",
          name: "Old Sam",
          email: "SAM@SCHOOL.EDU",
        }),
      ],
      [
        canvasStudent("101", "Alex Chen", "S-1", "alex@school.edu"),
        canvasStudent("102", "Jordan Lee", "S-2", "jordan@school.edu", "jlee"),
        canvasStudent("103", "Sam Patel", null, "sam@school.edu"),
      ],
    );

    expect(plan.unchanged).toBe(1);
    expect(plan.updates.map((update) => update.id)).toEqual([
      "student-id-match",
      "email-match",
    ]);
    expect(plan.updates[0].data).toMatchObject({
      canvasUserId: "102",
      name: "Jordan Lee",
      sisLoginId: "jlee",
      rosterSource: "canvas",
      enrollmentStatus: "active",
    });
    expect(plan.creates).toEqual([]);
  });

  it("creates new students and only inactivates missing Canvas-managed students", () => {
    const plan = planCanvasRosterSync(
      [
        student({
          id: "dropped-canvas",
          name: "Dropped Student",
          canvasUserId: "201",
          rosterSource: "canvas",
        }),
        student({
          id: "manual-student",
          name: "Manual Student",
        }),
      ],
      [canvasStudent("202", "New Student", "S-202", "new@school.edu")],
    );

    expect(plan.creates).toEqual([
      canvasStudent("202", "New Student", "S-202", "new@school.edu"),
    ]);
    expect(plan.inactivateIds).toEqual(["dropped-canvas"]);
    expect(plan.inactivateIds).not.toContain("manual-student");
  });

  it("reactivates a returning Canvas student", () => {
    const plan = planCanvasRosterSync(
      [
        student({
          id: "returning",
          name: "Asha Patel",
          canvasUserId: "301",
          rosterSource: "canvas",
          enrollmentStatus: "inactive",
        }),
      ],
      [canvasStudent("301", "Asha Patel", null, null)],
    );

    expect(plan.updates[0]).toMatchObject({
      id: "returning",
      data: { enrollmentStatus: "active" },
    });
    expect(plan.inactivateIds).toEqual([]);
  });

  it("does not inactivate a Canvas student rematched by SIS ID", () => {
    const plan = planCanvasRosterSync(
      [
        student({
          id: "changed-canvas-id",
          name: "Taylor Kim",
          studentNumber: "S-401",
          canvasUserId: "old-401",
          rosterSource: "canvas",
        }),
      ],
      [canvasStudent("new-401", "Taylor Kim", "S-401", null)],
    );

    expect(plan.updates[0].data.canvasUserId).toBe("new-401");
    expect(plan.inactivateIds).toEqual([]);
  });
});

function student(
  overrides: Partial<{
    id: string;
    name: string;
    email: string | null;
    studentNumber: string | null;
    sisLoginId: string | null;
    canvasUserId: string | null;
    rosterSource: string;
    enrollmentStatus: string;
  }>,
) {
  return {
    id: "student",
    name: "Student",
    email: null,
    studentNumber: null,
    sisLoginId: null,
    canvasUserId: null,
    rosterSource: "manual",
    enrollmentStatus: "active",
    ...overrides,
  };
}

function canvasStudent(
  canvasUserId: string,
  name: string,
  studentNumber: string | null,
  email: string | null,
  sisLoginId: string | null = null,
) {
  return { canvasUserId, name, studentNumber, sisLoginId, email };
}
