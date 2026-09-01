import { describe, expect, it } from "vitest";
import { signupAccess } from "@/lib/signupAccess";

describe("signupAccess", () => {
  it("allows the first account in production", () => {
    expect(signupAccess({ userCount: 0, pendingInvite: false, env: { NODE_ENV: "production" } })).toEqual({
      ok: true,
    });
  });

  it("allows a matching course invite in production", () => {
    expect(
      signupAccess({
        userCount: 2,
        pendingInvite: true,
        env: { NODE_ENV: "production" },
      }),
    ).toEqual({ ok: true });
  });

  it("allows a matching signup invite code", () => {
    expect(
      signupAccess({
        userCount: 2,
        pendingInvite: false,
        inviteCode: "staff-2026",
        env: { NODE_ENV: "production", SIGNUP_INVITE: "staff-2026" },
      }),
    ).toEqual({ ok: true });
  });

  it("blocks strangers in production", () => {
    const result = signupAccess({
      userCount: 1,
      pendingInvite: false,
      env: { NODE_ENV: "production" },
    });
    expect(result.ok).toBe(false);
  });

  it("stays open in development", () => {
    expect(signupAccess({ userCount: 3, pendingInvite: false, env: { NODE_ENV: "development" } })).toEqual({
      ok: true,
    });
  });
});
