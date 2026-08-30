export type SidebarCourse = {
  id: string;
  name: string;
  code: string | null;
  assignments: Array<{ id: string; title: string }>;
};

export function isAssignmentsHome(pathname: string): boolean {
  return pathname === "/";
}

export function isCoursesHome(pathname: string): boolean {
  return pathname === "/courses";
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
