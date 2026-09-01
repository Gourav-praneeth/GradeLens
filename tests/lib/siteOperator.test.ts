import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  findFirst: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findFirst: db.findFirst,
    },
  },
}));

import { isFeedbackAdminEmail, isSiteOperator } from "@/lib/siteOperator";

const admin = { id: "admin", email: "admin@school.edu", name: "Admin", emailVerified: true };
const firstUser = { id: "first", email: "first@school.edu", name: "First", emailVerified: true };

describe("isFeedbackAdminEmail", () => {
  it("matches the configured operator email", () => {
    expect(isFeedbackAdminEmail("you@school.edu", "you@school.edu")).toBe(true);
    expect(isFeedbackAdminEmail("You@School.edu", "you@school.edu")).toBe(true);
  });

  it("rejects other emails and an empty setting", () => {
    expect(isFeedbackAdminEmail("ta@school.edu", "you@school.edu")).toBe(false);
    expect(isFeedbackAdminEmail("you@school.edu", "")).toBe(false);
    expect(isFeedbackAdminEmail("you@school.edu", undefined)).toBe(false);
  });
});

describe("isSiteOperator", () => {
  beforeEach(() => {
    delete process.env.FEEDBACK_ADMIN_EMAIL;
    db.findFirst.mockReset();
  });

  afterEach(() => {
    delete process.env.FEEDBACK_ADMIN_EMAIL;
  });

  it("uses only the configured admin when an email is set", async () => {
    process.env.FEEDBACK_ADMIN_EMAIL = "admin@school.edu";
    db.findFirst.mockResolvedValue({ id: firstUser.id });

    await expect(isSiteOperator(admin)).resolves.toBe(true);
    await expect(isSiteOperator(firstUser)).resolves.toBe(false);
    expect(db.findFirst).not.toHaveBeenCalled();
  });

  it("falls back to the earliest account when no admin email is configured", async () => {
    db.findFirst.mockResolvedValue({ id: firstUser.id });

    await expect(isSiteOperator(firstUser)).resolves.toBe(true);
    await expect(isSiteOperator(admin)).resolves.toBe(false);
    expect(db.findFirst).toHaveBeenCalledTimes(2);
  });

  it("does not grant fallback access for a blank database", async () => {
    db.findFirst.mockResolvedValue(null);

    await expect(isSiteOperator(firstUser)).resolves.toBe(false);
  });
});
