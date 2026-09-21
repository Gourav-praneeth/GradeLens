import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CanvasApiError,
  fetchCanvasSubmissionFiles,
  fetchCanvasStudents,
  normalizeCanvasBaseUrl,
} from "@/lib/canvas";

describe("normalizeCanvasBaseUrl", () => {
  it("keeps only a secure public origin", () => {
    expect(
      normalizeCanvasBaseUrl(" https://school.instructure.com/courses/42 "),
    ).toBe("https://school.instructure.com");
  });

  it("rejects insecure and private URLs", () => {
    expect(() => normalizeCanvasBaseUrl("http://school.instructure.com")).toThrow(
      "must use HTTPS",
    );
    expect(() => normalizeCanvasBaseUrl("https://localhost")).toThrow(
      "public institution hostname",
    );
    expect(() => normalizeCanvasBaseUrl("https://192.168.1.2")).toThrow(
      "public institution hostname",
    );
    expect(() => normalizeCanvasBaseUrl("https://[::1]")).toThrow(
      "public institution hostname",
    );
  });
});

describe("fetchCanvasStudents", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("follows pagination and maps only active student enrollments", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              type: "StudentEnrollment",
              enrollment_state: "active",
              user: {
                id: 11,
                name: "Alex Chen",
                sis_user_id: "S-11",
                email: "alex@school.edu",
              },
            },
            {
              type: "StudentEnrollment",
              enrollment_state: "inactive",
              user: { id: 12, name: "Dropped Student" },
            },
            {
              type: "TeacherEnrollment",
              enrollment_state: "active",
              user: { id: 13, name: "Professor" },
            },
          ]),
          {
            headers: {
              Link: '<https://school.instructure.com/api/v1/courses/42/enrollments?page=2>; rel="next"',
            },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              type: "StudentEnrollment",
              enrollment_state: "active",
              user: {
                id: "14",
                name: "Jordan Lee",
                login_id: "jordan@school.edu",
              },
            },
          ]),
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchCanvasStudents(
        { baseUrl: "https://school.instructure.com", accessToken: "secret-token" },
        "42",
      ),
    ).resolves.toEqual([
      {
        canvasUserId: "11",
        name: "Alex Chen",
        studentNumber: "S-11",
        sisLoginId: null,
        email: "alex@school.edu",
      },
      {
        canvasUserId: "14",
        name: "Jordan Lee",
        studentNumber: null,
        sisLoginId: "jordan@school.edu",
        email: "jordan@school.edu",
      },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      headers: {
        Authorization: "Bearer secret-token",
        Accept: "application/json",
      },
    });
  });

  it("turns Canvas authorization failures into actionable errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 403 })));

    await expect(
      fetchCanvasStudents(
        { baseUrl: "https://school.instructure.com", accessToken: "bad-token" },
        "42",
      ),
    ).rejects.toEqual(
      new CanvasApiError("The Canvas token does not have permission to read this roster."),
    );
  });

  it("maps supported Canvas submission attachments and skips unsupported work", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify([
            {
              id: 501,
              user_id: 11,
              submitted_at: "2026-09-20T12:00:00Z",
              workflow_state: "submitted",
              attachments: [
                {
                  display_name: "homework.pdf",
                  url: "https://school.instructure.com/files/1/download",
                  content_type: "application/pdf",
                },
              ],
            },
            {
              id: 502,
              user_id: 12,
              submitted_at: "2026-09-20T12:00:00Z",
              workflow_state: "submitted",
              attachments: [
                {
                  display_name: "program.zip",
                  url: "https://school.instructure.com/files/2/download",
                  content_type: "application/zip",
                },
              ],
            },
          ]),
        ),
      ),
    );

    await expect(
      fetchCanvasSubmissionFiles(
        { baseUrl: "https://school.instructure.com", accessToken: "secret-token" },
        "42",
        "77",
      ),
    ).resolves.toEqual({
      submissions: [
        {
          canvasSubmissionId: "501",
          canvasUserId: "11",
          submittedAt: "2026-09-20T12:00:00Z",
          filename: "homework.pdf",
          downloadUrl: "https://school.instructure.com/files/1/download",
        },
      ],
      warnings: ["Canvas submission 502 has no supported PDF or text attachment."],
    });
  });
});
