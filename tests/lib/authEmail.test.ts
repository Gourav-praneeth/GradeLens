import { afterEach, describe, expect, it } from "vitest";
import { hashToken } from "@/lib/authTokens";
import { emailEnabled, emailFrom } from "@/lib/mail";
import { appOrigin } from "@/lib/origin";

describe("hashToken", () => {
  it("is stable and not the raw token", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toBe("abc");
    expect(hashToken("abc")).not.toBe(hashToken("abd"));
  });
});

describe("emailEnabled", () => {
  const original = { RESEND_API_KEY: process.env.RESEND_API_KEY, EMAIL_FROM: process.env.EMAIL_FROM };

  afterEach(() => {
    process.env.RESEND_API_KEY = original.RESEND_API_KEY;
    process.env.EMAIL_FROM = original.EMAIL_FROM;
  });

  it("requires both a Resend key and a from address", () => {
    expect(emailEnabled({ RESEND_API_KEY: "re_test", EMAIL_FROM: "GradeLens <noreply@example.com>" })).toBe(true);
    expect(emailEnabled({ RESEND_API_KEY: "re_test" })).toBe(false);
    expect(emailFrom({ EMAIL_FROM: "  " })).toBeNull();
  });
});

describe("appOrigin", () => {
  it("prefers PUBLIC_APP_URL", () => {
    const request = new Request("http://localhost:3000/api/auth/signup");
    expect(appOrigin(request, { PUBLIC_APP_URL: "https://grade-lens.up.railway.app/" })).toBe(
      "https://grade-lens.up.railway.app",
    );
  });

  it("uses forwarded host when no public URL is set", () => {
    const request = new Request("http://localhost:3000/api/auth/signup", {
      headers: { "x-forwarded-proto": "https", "x-forwarded-host": "grade-lens.up.railway.app" },
    });
    expect(appOrigin(request, {})).toBe("https://grade-lens.up.railway.app");
  });
});
