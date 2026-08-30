import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { courseDisplayName } from "@/lib/courseName";
import { prisma } from "@/lib/db";
import { formatPoints } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const assignments = await prisma.assignment.findMany({
    where: { course: { members: { some: { userId: user.id } } } },
    orderBy: { createdAt: "desc" },
    include: {
      course: true,
      rubric: { include: { criteria: true } },
      submissions: { include: { gradeResult: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Assignments</h1>
        <p className="mt-1 text-sm text-muted">Create an assignment, save a rubric, then grade submissions.</p>
      </div>

      {assignments.length === 0 ? (
        <section className="card px-6 py-12 sm:px-10">
          <p className="text-lg font-semibold">No assignments yet</p>
          <p className="mt-2 max-w-lg text-sm text-muted">
            Add a course, then file questions and official solutions. GradeLens drafts a rubric and scores each submission.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/courses/new" className="btn btn-ghost">
              New course
            </Link>
            <Link href="/assignments/new" className="btn btn-primary">
              New assignment
            </Link>
          </div>
        </section>
      ) : (
        <section className="card overflow-hidden">
          <div className="hidden grid-cols-[minmax(0,1.4fr)_8rem_8rem_7rem] gap-4 border-b border-line px-5 py-3 text-xs font-semibold text-muted sm:grid">
            <span>Assignment</span>
            <span>Rubric</span>
            <span>Progress</span>
            <span className="text-right">Points</span>
          </div>
          <ul>
            {assignments.map((assignment) => {
              const possible = assignment.rubric?.criteria.reduce((sum, row) => sum + row.maxPoints, 0) ?? 0;
              const graded = assignment.submissions.filter((item) => item.gradeResult).length;
              return (
                <li key={assignment.id} className="border-b border-line last:border-b-0">
                  <Link
                    href={`/assignments/${assignment.id}`}
                    className="grid gap-1 px-5 py-4 transition hover:bg-canvas sm:grid-cols-[minmax(0,1.4fr)_8rem_8rem_7rem] sm:items-center sm:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{assignment.title}</p>
                      <p className="text-sm text-muted">{courseDisplayName(assignment)}</p>
                    </div>
                    <p className="text-sm">
                      {assignment.rubric ? (
                        <span className="status status-ok">Ready</span>
                      ) : (
                        <span className="status">Needs rubric</span>
                      )}
                    </p>
                    <p className="text-sm text-muted">
                      {assignment.submissions.length === 0
                        ? "No submissions"
                        : `${graded} of ${assignment.submissions.length} graded`}
                    </p>
                    <p className="font-mono text-sm tabular-nums text-mark sm:text-right">
                      {assignment.rubric ? `${formatPoints(possible)} pts` : "—"}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
