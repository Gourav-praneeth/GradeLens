import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  requireCourseAccess: vi.fn(),
  transaction: vi.fn(),
  create: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@/lib/access", () => ({
  requireUser: mocks.requireUser,
  requireCourseAccess: mocks.requireCourseAccess,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: mocks.transaction,
    student: {
      create: mocks.create,
      upsert: mocks.upsert,
    },
  },
}));

import { POST } from "@/app/api/courses/[id]/students/route";

describe("course roster CSV import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({
      user: { id: "user-1" },
      error: null,
    });
    mocks.requireCourseAccess.mockResolvedValue({
      member: { role: "owner" },
      error: null,
    });
    mocks.upsert.mockResolvedValue({ id: "student-1" });
    mocks.create.mockResolvedValue({ id: "student-1" });
    mocks.transaction.mockImplementation(async (operations: unknown[]) =>
      Promise.all(operations),
    );
  });

  it("upserts repeatable Canvas gradebook rows by Canvas ID", async () => {
    const csvText =
      'Student,ID,SIS Login ID,Section\nPoints Possible,,,\n"Abdelmalak, Marina",894602,mabdelm5,77228';

    const response = await POST(
      jsonRequest({ csvText }),
      { params: Promise.resolve({ id: "course-1" }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.upsert).toHaveBeenCalledWith({
      where: {
        courseId_canvasUserId: {
          courseId: "course-1",
          canvasUserId: "894602",
        },
      },
      create: {
        courseId: "course-1",
        name: "Marina Abdelmalak",
        email: null,
        studentNumber: null,
        sisLoginId: "mabdelm5",
        canvasUserId: "894602",
        rosterSource: "canvas_csv",
        enrollmentStatus: "active",
      },
      update: {
        name: "Marina Abdelmalak",
        email: null,
        studentNumber: null,
        sisLoginId: "mabdelm5",
        canvasUserId: "894602",
        rosterSource: "canvas_csv",
        enrollmentStatus: "active",
      },
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });
});

function jsonRequest(body: object): Request {
  return new Request("http://localhost/api/courses/course-1/students", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
