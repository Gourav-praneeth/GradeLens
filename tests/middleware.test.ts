import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { middleware } from "@/middleware";

describe("middleware navigation", () => {
  it("allows signed-in users to open Help", () => {
    const response = middleware(request("/help", true));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
  });

  it("keeps Help available while signed out", () => {
    const response = middleware(request("/help", false));

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("lets the login page validate a possibly stale session cookie", () => {
    const response = middleware(request("/login", true));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects a signed-out user to login for protected pages", () => {
    const response = middleware(request("/courses/course-1", false));

    expect(response.headers.get("location")).toBe(
      "http://localhost/login?next=%2Fcourses%2Fcourse-1",
    );
  });
});

function request(pathname: string, signedIn: boolean): NextRequest {
  return new NextRequest(`http://localhost${pathname}`, {
    headers: signedIn ? { cookie: "gl_session=test-session" } : undefined,
  });
}
