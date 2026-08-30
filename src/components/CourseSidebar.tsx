"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { courseWorkspaceNav, activeCourseSection } from "@/lib/nav";

export function CourseSidebar({
  course,
}: {
  course: { id: string; name: string; code: string | null; accent: string };
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const items = courseWorkspaceNav(course.id);

  return (
    <aside className={`course-rail ${collapsed ? "is-collapsed" : ""}`} style={{ ["--course-accent" as string]: course.accent }}>
      <div className="course-rail-head">
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted">Course</p>
            <p className="truncate font-semibold">{course.code || course.name}</p>
          </div>
        ) : null}
        <button type="button" className="icon-btn" onClick={() => setCollapsed((value) => !value)}>
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>
      <nav className="course-rail-nav" aria-label="Course">
        {items.course.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item${activeCourseSection(pathname, course.id) === item.id ? " nav-item-active" : ""}`}
            title={item.label}
          >
            {collapsed ? item.label.slice(0, 1) : item.label}
          </Link>
        ))}
        <p className="rail-label">{collapsed ? "Mgmt" : "Course management"}</p>
        {items.management.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item${activeCourseSection(pathname, course.id) === item.id ? " nav-item-active" : ""}`}
            title={item.label}
          >
            {collapsed ? item.label.slice(0, 1) : item.label}
          </Link>
        ))}
      </nav>
      <div className="course-rail-foot">
        <Link href="/help" className="nav-item">
          {collapsed ? "?" : "Help / Documentation"}
        </Link>
        <Link href="/account" className="nav-item">
          {collapsed ? "A" : "Account"}
        </Link>
        <button
          className="nav-item w-full text-left font-normal"
          type="button"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
        >
          {collapsed ? "X" : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
