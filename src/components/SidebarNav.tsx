"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "./LogoutButton";
import type { AuthUser } from "@/lib/auth";
import {
  assignmentPathState,
  coursePathState,
  isAssignmentsHome,
  isCoursesHome,
  isNewAssignment,
  isNewCourse,
  type SidebarCourse,
} from "@/lib/nav";

export function SidebarNav({ user, courses }: { user: AuthUser; courses: SidebarCourse[] }) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <Link href="/" className="block text-[1.2rem] font-semibold tracking-tight">
        GradeLens
      </Link>
      <p className="mt-1 text-xs text-muted">{user.name}</p>

      <nav className="mt-6 space-y-1" aria-label="Main">
        <Link href="/" className={navClass(isAssignmentsHome(pathname))}>
          Assignments
        </Link>
        <Link href="/courses" className={navClass(isCoursesHome(pathname) || pathname.startsWith("/courses/"))}>
          Courses
        </Link>
        <Link href="/courses/new" className={navClass(isNewCourse(pathname))}>
          New course
        </Link>
        <Link href="/assignments/new" className={navClass(isNewAssignment(pathname))}>
          New assignment
        </Link>
      </nav>

      <p className="mt-8 mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted">Courses</p>
      <nav className="space-y-3" aria-label="Course list">
        {courses.length === 0 ? (
          <p className="px-2 text-sm text-muted">No courses yet</p>
        ) : (
          courses.map((course) => (
            <div key={course.id} className="space-y-1">
              <Link href={`/courses/${course.id}`} className={navClass(coursePathState(pathname, course.id))}>
                <span className="block truncate">{course.code || course.name}</span>
                {course.code ? <span className="block truncate text-xs font-normal text-muted">{course.name}</span> : null}
              </Link>
              {course.assignments.map((assignment) => {
                const state = assignmentPathState(pathname, assignment.id);
                const nested = state.onAssignment;
                return (
                  <div key={assignment.id} className="ml-2">
                    <Link href={`/assignments/${assignment.id}`} className={navClass(state.onAssignment)}>
                      <span className="block truncate text-sm font-medium">{assignment.title}</span>
                    </Link>
                    {nested ? (
                      <div className="ml-3 space-y-1 border-l border-line pl-3">
                        <Link
                          href={`/assignments/${assignment.id}`}
                          className={navClass(state.onOverview && !state.onSubmissions && !state.onReview)}
                        >
                          Overview
                        </Link>
                        <Link
                          href={`/assignments/${assignment.id}/submissions`}
                          className={navClass(state.onSubmissions)}
                        >
                          Submissions
                        </Link>
                        <Link href={`/assignments/${assignment.id}/review`} className={navClass(state.onReview)}>
                          Review
                        </Link>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </nav>

      <div className="mt-8">
        <LogoutButton />
      </div>
    </aside>
  );
}

function navClass(active: boolean): string {
  return `nav-item${active ? " nav-item-active" : ""}`;
}
