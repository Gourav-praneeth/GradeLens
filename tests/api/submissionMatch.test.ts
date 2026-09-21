import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  guardAssignment: vi.fn(),
  submissionFindFirst: vi.fn(),
  submissionUpdate: vi.fn(),
  studentFindFirst: vi.fn(),
}));

vi.mock("@/lib/access", () => ({
  guardAssignment: mocks.guardAssignment,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    submission: {
      findFirst: mocks.submissionFindFirst,
      update: mocks.submissionUpdate,
    },
    student: {
      findFirst: mocks.studentFindFirst,
    },
  },
}));

import { PATCH } from "@/app/api/assignments/[id]/submissions/[sid]/match/route";

describe("submission matching route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.guardAssignment.mockResolvedValue({
      ok: true,
      user: { id: "user-1" },
      assignment: { id: "assignment-1", courseId: "course-1" },
    });
    mocks.studentFindFirst.mockResolvedValue({ id: "student-1", name: "Alex Chen" });
    mocks.submissionUpdate.mockResolvedValue({ id: "submission-1" });
  });

  it("manually resolves an unmatched submission", async () => {
    mocks.submissionFindFirst
      .mockResolvedValueOnce({ id: "submission-1", assignmentId: "assignment-1" })
      .mockResolvedValueOnce(null);

    const response = await PATCH(
      jsonRequest({ studentId: "student-1" }),
      {
        params: Promise.resolve({
          id: "assignment-1",
          sid: "submission-1",
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(mocks.submissionUpdate).toHaveBeenCalledWith({
      where: { id: "submission-1" },
      data: {
        studentId: "student-1",
        studentLabel: "Alex Chen",
        matchStatus: "matched",
        matchMethod: "manual",
      },
    });
  });

  it("rejects a second submission for the same student", async () => {
    mocks.submissionFindFirst
      .mockResolvedValueOnce({ id: "submission-1", assignmentId: "assignment-1" })
      .mockResolvedValueOnce({ id: "submission-2" });

    const response = await PATCH(
      jsonRequest({ studentId: "student-1" }),
      {
        params: Promise.resolve({
          id: "assignment-1",
          sid: "submission-1",
        }),
      },
    );

    expect(response.status).toBe(400);
    expect(mocks.submissionUpdate).not.toHaveBeenCalled();
  });
});

function jsonRequest(body: object): Request {
  return new Request("http://localhost/api/match", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
