import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  guardAssignment: vi.fn(),
  assignmentFindUnique: vi.fn(),
  submissionFindMany: vi.fn(),
  submissionCount: vi.fn(),
  runGrading: vi.fn(),
}));

vi.mock("@/lib/access", () => ({
  guardAssignment: mocks.guardAssignment,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    assignment: { findUnique: mocks.assignmentFindUnique },
    submission: {
      findMany: mocks.submissionFindMany,
      count: mocks.submissionCount,
    },
  },
}));

vi.mock("@/lib/grading", () => ({
  runGrading: mocks.runGrading,
}));

import { POST } from "@/app/api/assignments/[id]/grade-all/route";

describe("bulk grading identity guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.guardAssignment.mockResolvedValue({
      ok: true,
      user: { id: "user-1" },
      assignment: { id: "assignment-1" },
    });
    mocks.assignmentFindUnique.mockResolvedValue({
      id: "assignment-1",
      rubric: { id: "rubric-1" },
    });
  });

  it("excludes unresolved submissions from the grading query", async () => {
    mocks.submissionFindMany.mockResolvedValue([
      { id: "submission-1", studentLabel: "Alex Chen" },
    ]);
    mocks.submissionCount.mockResolvedValue(2);

    const response = await POST(new Request("http://localhost", { method: "POST" }), {
      params: Promise.resolve({ id: "assignment-1" }),
    });

    expect(response.status).toBe(200);
    expect(mocks.submissionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          studentId: { not: null },
          matchStatus: "matched",
        }),
      }),
    );
    await expect(response.json()).resolves.toMatchObject({ graded: 1, unresolved: 2 });
  });

  it("explains when only unresolved submissions remain", async () => {
    mocks.submissionFindMany.mockResolvedValue([]);
    mocks.submissionCount.mockResolvedValue(3);

    const response = await POST(new Request("http://localhost", { method: "POST" }), {
      params: Promise.resolve({ id: "assignment-1" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "3 submissions need a student match before bulk grading.",
    });
    expect(mocks.runGrading).not.toHaveBeenCalled();
  });
});
