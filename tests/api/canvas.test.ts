import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  requireCourseAccess: vi.fn(),
  guardAssignment: vi.fn(),
  saveCanvasCredentials: vi.fn(),
  clearCanvasCredentials: vi.fn(),
  canvasCredentialStatus: vi.fn(),
  syncCanvasRoster: vi.fn(),
  importCanvasSubmissions: vi.fn(),
}));

vi.mock("@/lib/access", () => ({
  requireUser: mocks.requireUser,
  requireCourseAccess: mocks.requireCourseAccess,
  guardAssignment: mocks.guardAssignment,
}));

vi.mock("@/lib/canvasCredentials", () => ({
  saveCanvasCredentials: mocks.saveCanvasCredentials,
  clearCanvasCredentials: mocks.clearCanvasCredentials,
  canvasCredentialStatus: mocks.canvasCredentialStatus,
}));

vi.mock("@/lib/canvasSync", () => ({
  syncCanvasRoster: mocks.syncCanvasRoster,
}));

vi.mock("@/lib/canvasSubmissionImport", () => ({
  importCanvasSubmissions: mocks.importCanvasSubmissions,
}));

import { PUT as saveConnection } from "@/app/api/account/canvas/route";
import { POST as importSubmissions } from "@/app/api/assignments/[id]/canvas-import/route";
import { POST as syncRoster } from "@/app/api/courses/[id]/canvas-sync/route";

describe("Canvas API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({
      user: { id: "user-1", email: "teacher@school.edu", name: "Teacher" },
      error: null,
    });
    mocks.requireCourseAccess.mockResolvedValue({
      member: { role: "owner" },
      error: null,
    });
    mocks.guardAssignment.mockResolvedValue({
      ok: true,
      user: { id: "user-1" },
      assignment: { id: "assignment-1", courseId: "course-1" },
    });
    mocks.canvasCredentialStatus.mockResolvedValue({
      configured: true,
      baseUrl: "https://school.instructure.com",
      hint: "••••oken",
    });
  });

  it("validates and saves an instructor Canvas connection", async () => {
    const response = await saveConnection(
      jsonRequest("http://localhost/api/account/canvas", {
        baseUrl: "https://school.instructure.com",
        accessToken: "secret-token",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.saveCanvasCredentials).toHaveBeenCalledWith(
      "user-1",
      "https://school.instructure.com",
      "secret-token",
    );
  });

  it("returns Canvas validation failures to the instructor", async () => {
    mocks.saveCanvasCredentials.mockRejectedValue(
      new Error("Canvas rejected the access token."),
    );

    const response = await saveConnection(
      jsonRequest("http://localhost/api/account/canvas", {
        baseUrl: "https://school.instructure.com",
        accessToken: "bad-token-value",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Canvas rejected the access token.",
    });
  });

  it("syncs a course roster for authorized course staff", async () => {
    mocks.syncCanvasRoster.mockResolvedValue({
      added: 2,
      updated: 1,
      unchanged: 3,
      inactivated: 0,
      totalActive: 6,
      syncedAt: "2026-09-21T00:00:00.000Z",
    });

    const response = await syncRoster(
      jsonRequest("http://localhost/api/courses/course-1/canvas-sync", {
        canvasCourseId: "42",
      }),
      { params: Promise.resolve({ id: "course-1" }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.syncCanvasRoster).toHaveBeenCalledWith("user-1", "course-1", "42");
  });

  it("requires a Canvas course ID before syncing", async () => {
    const response = await syncRoster(
      jsonRequest("http://localhost/api/courses/course-1/canvas-sync", {}),
      { params: Promise.resolve({ id: "course-1" }) },
    );

    expect(response.status).toBe(400);
    expect(mocks.syncCanvasRoster).not.toHaveBeenCalled();
  });

  it("imports a linked Canvas assignment idempotently", async () => {
    mocks.importCanvasSubmissions.mockResolvedValue({
      imported: 3,
      updated: 0,
      unchanged: 2,
      unmatched: 0,
      duplicates: 0,
      rejected: 0,
      warnings: [],
    });

    const response = await importSubmissions(
      jsonRequest("http://localhost/api/assignments/assignment-1/canvas-import", {
        canvasAssignmentId: "77",
      }),
      { params: Promise.resolve({ id: "assignment-1" }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.importCanvasSubmissions).toHaveBeenCalledWith(
      "user-1",
      "assignment-1",
      "77",
    );
  });
});

function jsonRequest(url: string, body: object): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
