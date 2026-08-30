import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InviteTaForm, RemoveMemberButton } from "@/components/TaForms";
import { RemoveStudentButton, StudentRosterForm } from "@/components/RosterForms";
import { getCurrentUser } from "@/lib/auth";
import { getCourseMembership, isOwner } from "@/lib/access";
import { prisma } from "@/lib/db";
import { formatPoints } from "@/lib/format";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function CoursePage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const member = await getCourseMembership(user.id, id);
  if (!member) notFound();

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      members: { include: { user: true }, orderBy: { role: "asc" } },
      invites: { orderBy: { createdAt: "asc" } },
      students: { orderBy: { name: "asc" } },
      assignments: {
        orderBy: { createdAt: "desc" },
        include: {
          rubric: { include: { criteria: true } },
          submissions: { include: { gradeResult: true } },
        },
      },
    },
  });
  if (!course) notFound();
  const owner = isOwner(member.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/courses" className="text-sm text-muted hover:text-ink hover:underline">
            Courses
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{course.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {course.code || "No code"} · You are {owner ? "the owner" : "a TA"}
          </p>
        </div>
        <Link href={`/assignments/new?courseId=${course.id}`} className="btn btn-primary">
          New assignment
        </Link>
      </div>

      <section className="card overflow-hidden">
        <div className="border-b border-line px-5 py-3">
          <h2 className="text-sm font-semibold">Assignments</h2>
        </div>
        {course.assignments.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted">No assignments in this course yet.</p>
        ) : (
          <ul>
            {course.assignments.map((assignment) => {
              const possible = assignment.rubric?.criteria.reduce((sum, row) => sum + row.maxPoints, 0) ?? 0;
              const graded = assignment.submissions.filter((item) => item.gradeResult).length;
              return (
                <li key={assignment.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3 last:border-b-0">
                  <Link href={`/assignments/${assignment.id}`} className="font-semibold hover:underline">
                    {assignment.title}
                  </Link>
                  <p className="text-sm text-muted">
                    {assignment.submissions.length === 0
                      ? "No submissions"
                      : `${graded} of ${assignment.submissions.length} graded`}
                    {assignment.rubric ? ` · ${formatPoints(possible)} pts` : " · Needs rubric"}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card px-5 py-6">
        <h2 className="text-sm font-semibold">Roster</h2>
        <p className="mt-1 mb-4 text-sm text-muted">Add student names so submissions attach to people, not filenames.</p>
        <StudentRosterForm courseId={course.id} />
        {course.students.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No students yet.</p>
        ) : (
          <ul className="mt-4 divide-y border-t border-line">
            {course.students.map((student) => (
              <li key={student.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{student.name}</p>
                  {student.email ? <p className="text-sm text-muted">{student.email}</p> : null}
                </div>
                <RemoveStudentButton courseId={course.id} studentId={student.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card px-5 py-6">
        <h2 className="text-sm font-semibold">Teaching assistants</h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          TAs can grade this course. If they do not have an account yet, they join automatically when they sign up with the invited email.
        </p>
        {owner ? <InviteTaForm courseId={course.id} /> : <p className="text-sm text-muted">Only the owner can add TAs.</p>}
        <ul className="mt-4 divide-y border-t border-line">
          {course.members.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium">{row.user.name}</p>
                <p className="text-sm text-muted">
                  {row.user.email} · {row.role === "owner" ? "Owner" : "TA"}
                </p>
              </div>
              {owner && row.role !== "owner" ? (
                <RemoveMemberButton courseId={course.id} memberId={row.id} />
              ) : null}
            </li>
          ))}
          {course.invites.map((invite) => (
            <li key={invite.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium">{invite.email}</p>
                <p className="text-sm text-muted">Invite pending</p>
              </div>
              {owner ? <RemoveMemberButton courseId={course.id} inviteId={invite.id} /> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
