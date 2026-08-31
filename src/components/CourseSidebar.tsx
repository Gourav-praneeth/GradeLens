"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { RailIcon, railIconFor } from "@/components/RailIcons";
import { courseWorkspaceNav, activeCourseSection } from "@/lib/nav";

export function CourseSidebar({
  course,
}: {
  course: { id: string; name: string; code: string | null; accent: string };
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const items = courseWorkspaceNav(course.id);
  const section = activeCourseSection(pathname, course.id);

  return (
    <aside className={`course-rail ${collapsed ? "is-collapsed" : ""}`} style={{ ["--course-accent" as string]: course.accent }}>
      <div className="course-rail-head">
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted">Course</p>
            <p className="truncate font-semibold">{course.code || course.name}</p>
          </div>
        ) : null}
        <button
          type="button"
          className="rail-toggle"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((value) => !value)}
        >
          <span className={collapsed ? "rail-chevron is-flipped" : "rail-chevron"}>
            <RailIcon name="panel" />
          </span>
        </button>
      </div>
      <nav className="course-rail-nav" aria-label="Course">
        {items.course.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rail-link${section === item.id ? " nav-item-active" : ""}`}
            title={item.label}
            aria-current={section === item.id ? "page" : undefined}
          >
            <RailIcon name={railIconFor[item.id]} />
            <span className="rail-text">{item.label}</span>
          </Link>
        ))}
        {collapsed ? <div className="rail-rule" /> : <p className="rail-label">Course management</p>}
        {items.management.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rail-link${section === item.id ? " nav-item-active" : ""}`}
            title={item.label}
            aria-current={section === item.id ? "page" : undefined}
          >
            <RailIcon name={railIconFor[item.id]} />
            <span className="rail-text">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="course-rail-foot">
        <Link href="/help" className="rail-link" title="Help / Documentation">
          <RailIcon name="help" />
          <span className="rail-text">Help / Documentation</span>
        </Link>
        <Link href="/feedback" className="rail-link" title="Feedback">
          <RailIcon name="feedback" />
          <span className="rail-text">Feedback</span>
        </Link>
        <Link href="/account" className="rail-link" title="Account">
          <RailIcon name="account" />
          <span className="rail-text">Account</span>
        </Link>
        <button
          className="rail-link w-full"
          type="button"
          title="Sign out"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
        >
          <RailIcon name="signout" />
          <span className="rail-text">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
