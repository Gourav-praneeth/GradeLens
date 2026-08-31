import Link from "next/link";
import { notFound } from "next/navigation";
import { AssignmentNav } from "@/components/AssignmentNav";
import { ScoreOverride } from "@/components/ScoreOverride";
import { GradeOneButton } from "@/components/SubmissionPanel";
import { prisma } from "@/lib/db";
import { scanHelpText } from "@/lib/errors";
import { formatPoints, formatScore } from "@/lib/format";
import { requirePageAssignment, requirePageUser } from "@/lib/pageAuth";
import { studentDisplayName } from "@/lib/roster";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string; sid: string }> };

export default async function SubmissionPage({ params }: PageProps) {
  const user = await requirePageUser();
  const { id, sid } = await params;
  await requirePageAssignment(id, user.id);
  const submission = await prisma.submission.findFirst({
    where: { id: sid, assignmentId: id },
    include: {
      student: true,
      assignment: {
        include: {
          rubric: { include: { criteria: { orderBy: { sortOrder: "asc" } } } },
        },
      },
      gradeResult: {
        include: {
          scores: { include: { criterion: true } },
        },
      },
    },
  });

  if (!submission) {
    notFound();
  }

  const scores = submission.gradeResult
    ? [...submission.gradeResult.scores].sort(
        (a, b) => a.criterion.sortOrder - b.criterion.sortOrder,
      )
    : [];
  const hasText = Boolean(submission.extractedText.trim());
  const canGrade = Boolean(submission.assignment.rubric) && hasText;
  const siblings = await prisma.submission.findMany({
    where: { assignmentId: id },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  const index = siblings.findIndex((item) => item.id === sid);
  const previous = index > 0 ? siblings[index - 1] : null;
  const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`/assignments/${id}/submissions`}
            className="text-sm text-muted hover:text-ink hover:underline"
          >
            Submissions
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{studentDisplayName(submission)}</h1>
          <p className="mt-1 text-sm text-muted">
            {submission.assignment.title} · {submission.originalName}
          </p>
        </div>
        {submission.gradeResult ? (
          <p className="score-pill">
            {formatScore(submission.gradeResult.totalAwarded, submission.gradeResult.totalPossible)}
            <small>{scores.some((score) => score.overrideNote) ? "Override" : "Graded"}</small>
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {previous ? (
          <Link href={`/assignments/${id}/submissions/${previous.id}`} className="btn btn-ghost">
            Previous student
          </Link>
        ) : null}
        {next ? (
          <Link href={`/assignments/${id}/submissions/${next.id}`} className="btn btn-ghost">
            Next student
          </Link>
        ) : null}
      </div>

      <AssignmentNav assignmentId={id} current="submissions" />

      <section className="card px-5 py-5 sm:px-6">
        {submission.status === "failed" ? (
          <p className="text-pen">
            Grading failed. The model may be unavailable.{" "}
            <Link href="/account#grading-key" className="underline">
              Check your API key
            </Link>
            , then try Grade again.
          </p>
        ) : submission.gradeResult?.summary ? (
          <p>{submission.gradeResult.summary}</p>
        ) : hasText ? (
          <p className="text-muted">
            {submission.assignment.rubric
              ? "Not graded yet. Grade this submission, or grade remaining papers from the list."
              : "Save a rubric before grading."}
          </p>
        ) : (
          <p className="text-pen">{scanHelpText(submission.extractWarning)}</p>
        )}
        <div className="mt-4">
          <GradeOneButton
            assignmentId={id}
            submissionId={sid}
            disabled={!canGrade}
            label={submission.gradeResult ? "Grade again" : "Grade this submission"}
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <article className="card px-5 py-5 sm:px-6">
          <h2 className="text-sm font-semibold text-muted">Student work</h2>
          {hasText ? (
            <pre className="work-text mt-3">{submission.extractedText}</pre>
          ) : (
            <p className="mt-3 text-sm text-pen">{scanHelpText(submission.extractWarning)}</p>
          )}
        </article>

        <aside className="space-y-3">
          {scores.length === 0 ? (
            <div className="card px-5 py-6">
              <p className="text-sm text-muted">
                {canGrade
                  ? "No scores yet. Grade this submission to see per-criterion marks."
                  : "This paper cannot be graded until it has extractable text and a saved rubric."}
              </p>
            </div>
          ) : (
            scores.map((score) => {
              const deducted = score.criterion.maxPoints - score.pointsAwarded;
              return (
                <article key={score.id} className="card px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold">{score.criterion.label}</p>
                    <p className="font-mono text-sm tabular-nums text-mark">
                      {formatPoints(score.pointsAwarded)} / {formatPoints(score.criterion.maxPoints)}
                    </p>
                  </div>
                  <p className={`mt-1 text-sm ${deducted > 0 ? "deduct" : "full-mark"}`}>
                    {deducted > 0 ? `−${formatPoints(deducted)}` : "Full credit"}
                  </p>
                  <p className="mt-2 text-sm leading-6">{score.deductionReason}</p>
                  {score.evidenceQuote ? (
                    <blockquote className="mt-2 border-l-2 border-mark pl-3 font-read text-sm text-muted">
                      {score.evidenceQuote}
                    </blockquote>
                  ) : null}
                  <ScoreOverride
                    assignmentId={id}
                    submissionId={sid}
                    scoreId={score.id}
                    maxPoints={score.criterion.maxPoints}
                    pointsAwarded={score.pointsAwarded}
                    modelPointsAwarded={score.modelPointsAwarded}
                    overrideNote={score.overrideNote}
                  />
                </article>
              );
            })
          )}
        </aside>
      </div>
    </div>
  );
}
