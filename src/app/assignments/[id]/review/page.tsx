import Link from "next/link";
import { notFound } from "next/navigation";
import { AssignmentNav } from "@/components/AssignmentNav";
import { ExportLinks } from "@/components/ExportLinks";
import { clusterDeductions, scoreDistribution } from "@/lib/consistency";
import { prisma } from "@/lib/db";
import { formatPoints, formatScore } from "@/lib/format";
import { requirePageAssignment, requirePageUser } from "@/lib/pageAuth";
import { studentDisplayName } from "@/lib/roster";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function ReviewPage({ params }: PageProps) {
  const user = await requirePageUser();
  const { id } = await params;
  await requirePageAssignment(id, user.id);

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      rubric: { include: { criteria: { orderBy: { sortOrder: "asc" } } } },
      submissions: {
        orderBy: { createdAt: "asc" },
        include: {
          student: true,
          gradeResult: {
            include: { scores: { include: { criterion: true } } },
          },
        },
      },
    },
  });
  if (!assignment) notFound();

  const graded = assignment.submissions.filter((item) => item.gradeResult);
  const clusters = clusterDeductions(
    graded.flatMap((submission) =>
      (submission.gradeResult?.scores ?? []).map((score) => ({
        submissionId: submission.id,
        studentName: studentDisplayName(submission),
        criterionId: score.criterionId,
        criterionLabel: score.criterion.label,
        maxPoints: score.criterion.maxPoints,
        pointsAwarded: score.pointsAwarded,
        deductionReason: score.deductionReason,
      })),
    ),
  );
  const inconsistent = clusters.filter((cluster) => cluster.inconsistent);
  const bands = scoreDistribution(
    graded.map((item) => ({
      awarded: item.gradeResult!.totalAwarded,
      possible: item.gradeResult!.totalPossible,
    })),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/assignments/${assignment.id}`} className="text-sm text-muted hover:text-ink hover:underline">
            {assignment.title}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Review</h1>
          <p className="mt-1 text-sm text-muted">
            Check that similar mistakes received the same deduction, then export for Canvas or Gradescope.
          </p>
        </div>
        <ExportLinks assignmentId={assignment.id} />
      </div>

      <AssignmentNav assignmentId={assignment.id} current="review" />

      {graded.length < 2 ? (
        <section className="card px-5 py-8">
          <p className="font-semibold">Need more graded papers</p>
          <p className="mt-2 text-sm text-muted">
            Grade at least two submissions to compare deductions across the stack.
          </p>
        </section>
      ) : (
        <>
          <section className="card overflow-hidden">
            <div className="border-b border-line px-5 py-3">
              <h2 className="text-sm font-semibold">Score distribution</h2>
              <p className="text-sm text-muted">
                {graded.length} graded ·{" "}
                {inconsistent.length === 0
                  ? "No conflicting deductions found"
                  : `${inconsistent.length} ${inconsistent.length === 1 ? "cluster needs" : "clusters need"} a look`}
              </p>
            </div>
            <ul className="grid gap-0 sm:grid-cols-4">
              {bands.map((band) => (
                <li key={band.label} className="border-b border-line px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                  <p className="text-xs font-semibold text-muted">{band.label}</p>
                  <p className="mt-1 font-mono text-xl tabular-nums text-mark">{band.count}</p>
                </li>
              ))}
            </ul>
          </section>

          {clusters.length === 0 ? (
            <section className="card px-5 py-8">
              <p className="text-sm text-muted">No deductions yet. Full-credit papers will not appear here.</p>
            </section>
          ) : (
            <section className="space-y-3">
              {clusters.map((cluster) => (
                <article key={`${cluster.criterionId}-${cluster.fingerprint}`} className="card px-5 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{cluster.criterionLabel}</p>
                      <p className="mt-1 text-sm leading-6">{cluster.sampleReason}</p>
                    </div>
                    {cluster.inconsistent ? (
                      <span className="status status-bad">
                        {formatPoints(cluster.minPoints)}–{formatPoints(cluster.maxPointsAwarded)} pts
                      </span>
                    ) : (
                      <span className="status status-ok">Same mark</span>
                    )}
                  </div>
                  <ul className="mt-4 space-y-2">
                    {cluster.rows.map((row) => (
                      <li key={row.submissionId} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <Link
                          href={`/assignments/${assignment.id}/submissions/${row.submissionId}`}
                          className="font-semibold hover:underline"
                        >
                          {row.studentName}
                        </Link>
                        <p className="font-mono tabular-nums text-mark">
                          {formatScore(row.pointsAwarded, row.maxPoints)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
