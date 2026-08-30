import Link from "next/link";
import { notFound } from "next/navigation";
import { AssignmentNav } from "@/components/AssignmentNav";
import { GradeAllButton, SubmissionUploader } from "@/components/SubmissionPanel";
import { prisma } from "@/lib/db";
import { formatScore } from "@/lib/format";
import { scanHelpText } from "@/lib/errors";
import { requirePageAssignment, requirePageUser } from "@/lib/pageAuth";
import { studentDisplayName } from "@/lib/roster";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

function statusLabel(status: string) {
  if (status === "graded") return "Graded";
  if (status === "grading") return "Grading";
  if (status === "failed") return "Failed";
  return "Uploaded";
}

export default async function SubmissionsPage({ params }: PageProps) {
  const user = await requirePageUser();
  const { id } = await params;
  await requirePageAssignment(id, user.id);
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      rubric: true,
      course: { include: { students: { orderBy: { name: "asc" } } } },
      submissions: {
        orderBy: { createdAt: "asc" },
        include: { student: true, gradeResult: true },
      },
    },
  });
  if (!assignment) notFound();

  const ungraded = assignment.submissions.filter(
    (item) => !item.gradeResult && item.extractedText.trim(),
  ).length;
  const scans = assignment.submissions.filter((item) => !item.extractedText.trim()).length;
  const needsRegrade =
    Boolean(assignment.rubric) &&
    assignment.submissions.some((item) => item.extractedText.trim() && !item.gradeResult);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/assignments/${assignment.id}`} className="text-sm text-muted hover:text-ink hover:underline">
            {assignment.title}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Submissions</h1>
          <p className="mt-1 text-sm text-muted">Upload PDF or text files, then grade one submission or all remaining.</p>
        </div>
        <a href={`/api/assignments/${assignment.id}/export`} className="btn btn-ghost">
          Export CSV
        </a>
      </div>

      <AssignmentNav assignmentId={assignment.id} current="submissions" />

      {needsRegrade ? (
        <p className="card px-5 py-3 text-sm">
          Ungraded papers are ready. After a rubric edit, open a paper and choose Grade again, or grade all remaining.
        </p>
      ) : null}

      {scans > 0 ? (
        <p className="card px-5 py-3 text-sm text-pen">
          {scans} {scans === 1 ? "file has" : "files have"} no selectable text. Those cannot be graded until you upload a text-based PDF or .txt.
        </p>
      ) : null}

      <section className="card px-5 py-6 sm:px-8">
        <h2 className="text-sm font-semibold">Upload</h2>
        <div className="mt-4">
          <SubmissionUploader
            assignmentId={assignment.id}
            roster={assignment.course?.students.map((student) => ({ id: student.id, name: student.name })) ?? []}
          />
        </div>
        <div className="mt-5 border-t border-line pt-5">
          <GradeAllButton assignmentId={assignment.id} disabled={!assignment.rubric || ungraded === 0} />
          {!assignment.rubric ? (
            <p className="mt-2 text-sm text-muted">Generate and save a rubric before grading.</p>
          ) : ungraded === 0 && assignment.submissions.length > 0 ? (
            <p className="mt-2 text-sm text-muted">
              Nothing left to grade automatically. Scan PDFs stay ungraded until they have extractable text.
            </p>
          ) : null}
        </div>
      </section>

      <section className="card overflow-hidden">
        {assignment.submissions.length === 0 ? (
          <p className="px-6 py-10 text-sm text-muted">No submissions yet. Upload files above.</p>
        ) : (
          <ul>
            {assignment.submissions.map((submission) => {
              const failed = submission.status === "failed";
              const noText = !submission.extractedText.trim();
              return (
                <li
                  key={submission.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">{studentDisplayName(submission)}</p>
                    <p className="text-sm text-muted">
                      {submission.originalName}
                      {noText ? ` · ${scanHelpText(submission.extractWarning)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        failed || noText ? "status status-bad" : submission.gradeResult ? "status status-ok" : "status"
                      }
                    >
                      {noText ? "No text" : statusLabel(submission.status)}
                    </span>
                    <p className="min-w-16 text-right font-mono text-sm tabular-nums text-mark">
                      {submission.gradeResult
                        ? formatScore(submission.gradeResult.totalAwarded, submission.gradeResult.totalPossible)
                        : "—"}
                    </p>
                    <Link
                      href={`/assignments/${assignment.id}/submissions/${submission.id}`}
                      className="btn btn-ghost"
                    >
                      Open
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
