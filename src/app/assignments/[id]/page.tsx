import Link from "next/link";
import { notFound } from "next/navigation";
import { AssignmentNav } from "@/components/AssignmentNav";
import { DeleteAssignment } from "@/components/DeleteAssignment";
import { RubricEditor } from "@/components/RubricEditor";
import { courseDisplayName } from "@/lib/courseName";
import { prisma } from "@/lib/db";
import { formatPoints } from "@/lib/format";
import { requirePageAssignment, requirePageUser } from "@/lib/pageAuth";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AssignmentPage({ params }: PageProps) {
  const user = await requirePageUser();
  const { id } = await params;
  await requirePageAssignment(id, user.id);

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      course: true,
      rubric: { include: { criteria: { orderBy: { sortOrder: "asc" } } } },
      _count: { select: { submissions: true } },
    },
  });
  if (!assignment) notFound();

  const total =
    assignment.rubric?.criteria.reduce((sum, row) => sum + row.maxPoints, 0) ?? 0;
  const courseName = courseDisplayName(assignment);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/" className="text-sm text-muted hover:text-ink hover:underline">
            Assignments
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{assignment.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {assignment.courseId ? (
              <Link href={`/courses/${assignment.courseId}`} className="hover:text-ink hover:underline">
                {courseName}
              </Link>
            ) : (
              courseName
            )}
            {assignment.rubric
              ? ` · ${formatPoints(total)} pts · ${assignment._count.submissions} submissions`
              : " · Generate a rubric before grading"}
          </p>
        </div>
        <DeleteAssignment assignmentId={assignment.id} title={assignment.title} />
      </div>

      <AssignmentNav assignmentId={assignment.id} current="assignment" />

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="card px-5 py-5 sm:px-6">
          <h2 className="text-sm font-semibold text-muted">Questions</h2>
          <pre className="work-text mt-3 text-ink">{assignment.questionsText}</pre>
        </article>
        <article className="card px-5 py-5 sm:px-6">
          <h2 className="text-sm font-semibold text-muted">Official solutions</h2>
          <pre className="work-text mt-3 text-ink">{assignment.solutionsText}</pre>
        </article>
      </div>

      <section className="card px-5 py-6 sm:px-8">
        <RubricEditor
          assignmentId={assignment.id}
          initialCriteria={
            assignment.rubric?.criteria.map((row) => ({
              id: row.id,
              label: row.label,
              maxPoints: row.maxPoints,
              fullCreditDescription: row.fullCreditDescription,
            })) ?? []
          }
        />
        <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-5">
          {assignment.rubric ? (
            <>
              <Link href={`/assignments/${assignment.id}/submissions`} className="btn btn-primary">
                Go to submissions
              </Link>
              <a href={`/api/assignments/${assignment.id}/export`} className="btn btn-ghost">
                Export CSV
              </a>
            </>
          ) : (
            <p className="text-sm text-muted">Save a rubric to upload and grade submissions.</p>
          )}
        </div>
      </section>
    </div>
  );
}
