import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  isSiteOperator: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/access", () => ({
  requireUser: mocks.requireUser,
}));

vi.mock("@/lib/siteOperator", () => ({
  isSiteOperator: mocks.isSiteOperator,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    feedback: {
      findMany: mocks.findMany,
      create: mocks.create,
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
  },
}));

import { GET, POST } from "@/app/api/feedback/route";
import { PATCH } from "@/app/api/feedback/[id]/route";

const user = {
  id: "user-1",
  email: "instructor@school.edu",
  name: "Instructor",
  emailVerified: true,
};

describe("feedback API authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({ user, error: null });
  });

  it("does not let a non-admin list private feedback", async () => {
    mocks.isSiteOperator.mockResolvedValue(false);

    const response = await GET();

    expect(response.status).toBe(403);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("lets an admin list private feedback", async () => {
    const items = [{ id: "feedback-1", message: "Please fix this issue." }];
    mocks.isSiteOperator.mockResolvedValue(true);
    mocks.findMany.mockResolvedValue(items);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(items);
  });

  it("lets any signed-in user submit feedback without reading the inbox", async () => {
    mocks.create.mockResolvedValue({ id: "feedback-1" });
    const request = new Request("http://localhost/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Please fix this issue.", page: "/courses/course-1" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mocks.isSiteOperator).not.toHaveBeenCalled();
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        userId: user.id,
        message: "Please fix this issue.",
        page: "/courses/course-1",
      },
    });
  });

  it("does not let a non-admin update feedback", async () => {
    mocks.isSiteOperator.mockResolvedValue(false);
    const request = new Request("http://localhost/api/feedback/feedback-1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "feedback-1" }) });

    expect(response.status).toBe(403);
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("lets an admin update feedback", async () => {
    mocks.isSiteOperator.mockResolvedValue(true);
    mocks.findUnique.mockResolvedValue({ id: "feedback-1" });
    mocks.update.mockResolvedValue({ status: "done" });
    const request = new Request("http://localhost/api/feedback/feedback-1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "feedback-1" }) });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, status: "done" });
  });
});
