import { jsonError } from "./http";
import { getCurrentUser, type AuthUser } from "./auth";
import { prisma } from "./db";

export async function requireUser(): Promise<
  { user: AuthUser; error: null } | { user: null; error: ReturnType<typeof jsonError> }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, error: jsonError("Sign in to continue.", 401) };
  }
  return { user, error: null };
}

export async function getCourseMembership(userId: string, courseId: string) {
  return prisma.courseMember.findUnique({
    where: { courseId_userId: { courseId, userId } },
  });
}

export async function requireCourseAccess(userId: string, courseId: string) {
  const member = await getCourseMembership(userId, courseId);
  if (!member) {
    return { member: null, error: jsonError("You do not have access to this course.", 403) };
  }
  return { member, error: null };
}

export async function requireAssignmentAccess(userId: string, assignmentId: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { course: true },
  });
  if (!assignment) {
    return { assignment: null, member: null, error: jsonError("Assignment not found.", 404) };
  }
  if (!assignment.courseId) {
    return { assignment: null, member: null, error: jsonError("This assignment is not in a course yet.", 403) };
  }
  const member = await getCourseMembership(userId, assignment.courseId);
  if (!member) {
    return { assignment: null, member: null, error: jsonError("You do not have access to this assignment.", 403) };
  }
  return { assignment, member, error: null };
}

export async function guardAssignment(assignmentId: string) {
  const auth = await requireUser();
  if (auth.error) {
    return { ok: false as const, error: auth.error };
  }
  const access = await requireAssignmentAccess(auth.user.id, assignmentId);
  if (access.error) {
    return { ok: false as const, error: access.error };
  }
  return {
    ok: true as const,
    user: auth.user,
    assignment: access.assignment,
    member: access.member,
  };
}

export function isOwner(role: string): boolean {
  return role === "owner";
}
