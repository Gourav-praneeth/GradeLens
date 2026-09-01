import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { CourseForm } from "@/components/CourseForm";

describe("CourseForm", () => {
  it("renders a semester dropdown and named course colors", () => {
    const html = renderToStaticMarkup(createElement(CourseForm));

    expect(html).toContain('<select class="field" name="semester"');
    expect(html).toContain("Fall 2026");
    expect(html).toContain("Pacific");
    expect(html).toContain("Cobalt");
    expect(html).toContain("Ember");
  });

  it("preserves a legacy semester and color while editing", () => {
    const html = renderToStaticMarkup(
      createElement(CourseForm, {
        courseId: "course-1",
        initial: {
          name: "Computer Organization",
          code: "CSE 230",
          semester: "Autumn 2024",
          description: "",
          accent: "#123456",
          status: "active",
        },
      }),
    );

    expect(html).toContain("Current: Autumn 2024");
    expect(html).toContain("Existing course color");
    expect(html).toMatch(/<input[^>]+checked=""[^>]+value="#123456"/);
  });
});
