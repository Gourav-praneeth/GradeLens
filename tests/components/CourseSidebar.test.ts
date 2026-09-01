import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/courses/course-1",
}));

import { CourseSidebar } from "@/components/CourseSidebar";

const course = {
  id: "course-1",
  name: "Computer Organization",
  code: "CSE 230",
  accent: "#123456",
};

describe("CourseSidebar feedback navigation", () => {
  it("lets signed-in non-admins submit feedback without exposing the inbox", () => {
    const html = renderToStaticMarkup(createElement(CourseSidebar, { course, isAdmin: false }));

    expect(html).toContain('href="/help"');
    expect(html).toContain('href="/feedback"');
    expect(html).toContain('href="/account"');
    expect(html).not.toContain(">Settings</span>");
    expect(html).not.toContain('href="/admin/feedback"');
  });

  it("shows the inbox to admins", () => {
    const html = renderToStaticMarkup(createElement(CourseSidebar, { course, isAdmin: true }));

    expect(html).toContain('href="/feedback"');
    expect(html).toContain('href="/admin/feedback"');
  });
});
