import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { UserMenuPanel } from "@/components/UserMenu";

const user = {
  id: "user-1",
  email: "instructor@school.edu",
  name: "Instructor",
  emailVerified: true,
};

describe("UserMenuPanel", () => {
  it("has one account destination and no duplicate Settings item", () => {
    const html = renderToStaticMarkup(
      createElement(UserMenuPanel, { user, isAdmin: false, onNavigate: vi.fn() }),
    );

    expect(html.match(/href="\/account"/g)).toHaveLength(1);
    expect(html).toContain(">Account</a>");
    expect(html).not.toContain(">Settings</a>");
    expect(html).not.toContain('href="/admin/feedback"');
  });

  it("shows Inbox only for an administrator", () => {
    const html = renderToStaticMarkup(
      createElement(UserMenuPanel, { user, isAdmin: true, onNavigate: vi.fn() }),
    );

    expect(html).toContain('href="/admin/feedback"');
  });
});
