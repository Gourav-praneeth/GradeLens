export type SidebarCourse = {
  id: string;
  name: string;
  code: string | null;
  assignments: Array<{ id: string; title: string }>;
};

export function isCoursesHome(pathname: string): boolean {
  return pathname === "/" || pathname === "/courses";
}

export function isAssignmentsHome(pathname: string): boolean {
  return pathname === "/assignments";
}

export type CourseNavItem = { href: string; label: string; exact?: boolean; id: string };

export function courseWorkspaceNav(courseId: string): { course: CourseNavItem[]; management: CourseNavItem[] } {
  const root = `/courses/${courseId}`;
  return {
    course: [
      { id: "overview", href: root, label: "Overview", exact: true },
      { id: "assignments", href: `${root}/assignments`, label: "Assignments" },
      { id: "roster", href: `${root}/roster`, label: "Roster" },
      { id: "grades", href: `${root}/grades`, label: "Grades" },
      { id: "calendar", href: `${root}/calendar`, label: "Calendar" },
      { id: "analytics", href: `${root}/analytics`, label: "Analytics" },
    ],
    management: [
      { id: "staff", href: `${root}/staff`, label: "Teaching staff" },
      { id: "settings", href: `${root}/settings`, label: "Course settings" },
    ],
  };
}

export function activeCourseSection(pathname: string, courseId: string): string {
  if (pathname.startsWith("/assignments/")) return "assignments";
  const root = `/courses/${courseId}`;
  if (pathname === root) return "overview";
  if (pathname.startsWith(`${root}/assignments`)) return "assignments";
  if (pathname.startsWith(`${root}/roster`)) return "roster";
  if (pathname.startsWith(`${root}/grades`)) return "grades";
  if (pathname.startsWith(`${root}/calendar`)) return "calendar";
  if (pathname.startsWith(`${root}/analytics`)) return "analytics";
  if (pathname.startsWith(`${root}/staff`)) return "staff";
  if (pathname.startsWith(`${root}/settings`)) return "settings";
  return "overview";
}

export function isNewCourse(pathname: string): boolean {
  return pathname === "/courses/new";
}

export function isNewAssignment(pathname: string): boolean {
  return pathname === "/assignments/new";
}

export function coursePathState(pathname: string, courseId: string) {
  const root = `/courses/${courseId}`;
  return pathname === root || pathname.startsWith(`${root}/`);
}

export function assignmentPathState(pathname: string, assignmentId: string) {
  const root = `/assignments/${assignmentId}`;
  const onAssignment = pathname === root || pathname.startsWith(`${root}/`);
  return {
    onAssignment,
    onOverview: pathname === root,
    onSubmissions: pathname.startsWith(`${root}/submissions`),
    onReview: pathname.startsWith(`${root}/review`),
  };
}
