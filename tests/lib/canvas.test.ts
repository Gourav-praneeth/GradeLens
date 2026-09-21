import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CanvasApiError,
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
        email: "alex@school.edu",
      },
      {
        canvasUserId: "14",
        name: "Jordan Lee",
        studentNumber: null,
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
});
