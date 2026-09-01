import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TopBar } from "@/components/TopBar";

const user = {
  id: "user-1",
  email: "instructor@school.edu",
  name: "Instructor",
  emailVerified: true,
};

describe("TopBar", () => {
  it("uses the avatar menu as the account entry point", () => {
    const html = renderToStaticMarkup(createElement(TopBar, { user }));

    expect(html).not.toContain(">Settings</a>");
    expect(html).not.toContain('href="/account"');
    expect(html).toContain('aria-haspopup="menu"');
  });
});
