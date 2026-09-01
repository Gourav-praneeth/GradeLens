import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  requireCourseAccess: vi.fn(),
  create: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/lib/access", () => ({
  requireUser: mocks.requireUser,
  requireCourseAccess: mocks.requireCourseAccess,
  isOwner: (role: string) => role === "owner",
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    course: {
      create: mocks.create,
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
    courseMember: {
      findMany: mocks.findMany,
    },
  },
}));

import { POST } from "@/app/api/courses/route";
import { PATCH } from "@/app/api/courses/[id]/route";

const user = {
  id: "user-1",
  email: "instructor@school.edu",
  name: "Instructor",
  emailVerified: true,
};

describe("course option validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({ user, error: null });
    mocks.requireCourseAccess.mockResolvedValue({ member: { role: "owner" }, error: null });
  });

  it("rejects a free-text semester during course creation", async () => {
    const response = await POST(
      jsonRequest("http://localhost/api/courses", {
        name: "Computer Organization",
        semester: "Autumn sometime",
        accent: "#2457D6",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects an unsafe course color", async () => {
    const response = await POST(
      jsonRequest("http://localhost/api/courses", {
        name: "Computer Organization",
        semester: "Fall 2026",
        accent: "url(https://example.com)",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("stores a valid dropdown semester and color", async () => {
    mocks.create.mockResolvedValue({ id: "course-1" });

    const response = await POST(
      jsonRequest("http://localhost/api/courses", {
        name: " Computer Organization ",
        code: " CSE 230 ",
        semester: "Fall 2026",
        accent: "#2457D6",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        name: "Computer Organization",
        code: "CSE 230",
        semester: "Fall 2026",
        description: "",
        accent: "#2457D6",
        members: { create: { userId: user.id, role: "owner" } },
      },
    });
  });

  it("preserves an existing legacy semester when other settings change", async () => {
    mocks.findUnique.mockResolvedValue({ semester: "Autumn 2024" });
    mocks.update.mockResolvedValue({ id: "course-1" });

    const response = await PATCH(
      jsonRequest("http://localhost/api/courses/course-1", {
        name: "Computer Organization",
        semester: "Autumn 2024",
        accent: "#123456",
        status: "active",
      }),
      { params: Promise.resolve({ id: "course-1" }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "course-1" },
      data: {
        name: "Computer Organization",
        code: null,
        semester: "Autumn 2024",
        description: "",
        accent: "#123456",
        status: "active",
      },
    });
  });
});

function jsonRequest(url: string, body: object): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
