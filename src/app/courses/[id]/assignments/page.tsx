import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCourseMembership } from "@/lib/access";
import { assignmentLifecycle, assignmentStatusLabel } from "@/lib/assignmentStatus";
import { prisma } from "@/lib/db";
import { formatDue } from "@/lib/display";
import { formatPoints } from "@/lib/format";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function CourseAssignmentsPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!(await getCourseMembership(user.id, id))) notFound();

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      students: true,
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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-read text-3xl font-semibold tracking-tight">Assignments</h1>
          <p className="mt-1 text-sm text-muted">Create work, generate a rubric, then grade the stack.</p>
        </div>
        <Link href={`/assignments/new?courseId=${course.id}`} className="btn btn-primary">
          + Create assignment
        </Link>
      </div>

      <section className="card overflow-hidden">
        {course.assignments.length === 0 ? (
          <p className="px-5 py-10 text-sm text-muted">No assignments yet.</p>
        ) : (
          <div className="gradebook">
            <table>
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Due</th>
                  <th>Submissions</th>
                  <th>Graded</th>
                  <th>Average</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {course.assignments.map((assignment) => {
                  const possible = assignment.rubric?.criteria.reduce((sum, row) => sum + row.maxPoints, 0) ?? 0;
                  const graded = assignment.submissions.filter((item) => item.gradeResult);
                  const avg =
                    graded.length === 0
                      ? null
                      : graded.reduce((sum, item) => sum + (item.gradeResult?.totalAwarded ?? 0), 0) / graded.length;
                  const status = assignmentLifecycle({
                    status: assignment.status,
                    hasRubric: Boolean(assignment.rubric),
                    dueAt: assignment.dueAt,
                  });
                  return (
                    <tr key={assignment.id}>
                      <td>
                        <Link href={`/assignments/${assignment.id}`} className="font-semibold hover:underline">
                          {assignment.title}
                        </Link>
                        <p className="text-xs text-muted">{assignment.description || `${formatPoints(possible)} pts`}</p>
                      </td>
                      <td>{formatDue(assignment.dueAt)}</td>
                      <td className="font-mono tabular-nums">
                        {assignment.submissions.length}/{course.students.length || assignment.submissions.length}
                      </td>
                      <td className="font-mono tabular-nums">{graded.length}</td>
                      <td className="font-mono tabular-nums">{avg == null ? "—" : formatPoints(avg)}</td>
                      <td>{assignmentStatusLabel(status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
