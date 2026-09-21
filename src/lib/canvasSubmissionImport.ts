import {
  downloadCanvasSubmissionFile,
  fetchCanvasSubmissionFiles,
} from "./canvas";
import { requireCanvasCredentials } from "./canvasCredentials";
import { prisma } from "./db";
import { extractDocument } from "./extract";
import { saveUpload } from "./files";

export type CanvasSubmissionImportResult = {
  imported: number;
  updated: number;
  unchanged: number;
  unmatched: number;
  duplicates: number;
  rejected: number;
  warnings: string[];
};

export function canvasSubmissionDecision(
  existingSubmittedAt: Date | null | undefined,
  incomingSubmittedAt: string,
): { action: "create" | "update" | "unchanged"; submittedAt: Date } {
  const submittedAt = new Date(incomingSubmittedAt);
  if (Number.isNaN(submittedAt.getTime())) {
    throw new Error("Canvas submission date is invalid.");
  }
  if (!existingSubmittedAt) return { action: "create", submittedAt };
  return existingSubmittedAt.getTime() >= submittedAt.getTime()
    ? { action: "unchanged", submittedAt }
    : { action: "update", submittedAt };
}

export async function importCanvasSubmissions(
  userId: string,
  assignmentId: string,
  canvasAssignmentId: string,
): Promise<CanvasSubmissionImportResult> {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      course: {
        include: {
          students: {
            where: { enrollmentStatus: { not: "inactive" } },
          },
        },
      },
      submissions: { include: { gradeResult: true } },
    },
  });
  if (!assignment?.course?.canvasCourseId) {
    throw new Error("Sync the Canvas course roster before importing submissions.");
  }

  const credentials = await requireCanvasCredentials(userId);
  const fetched = await fetchCanvasSubmissionFiles(
    credentials,
    assignment.course.canvasCourseId,
    canvasAssignmentId,
  );
  const result: CanvasSubmissionImportResult = {
    imported: 0,
    updated: 0,
    unchanged: 0,
    unmatched: 0,
    duplicates: 0,
    rejected: 0,
    warnings: [...fetched.warnings],
  };
  const byCanvasSubmission = new Map(
    assignment.submissions
      .filter((submission) => submission.canvasSubmissionId)
      .map((submission) => [submission.canvasSubmissionId!, submission]),
  );
  const usedStudentIds = new Set(
    assignment.submissions.flatMap((submission) =>
      submission.studentId ? [submission.studentId] : [],
    ),
  );

  for (const file of fetched.submissions) {
    const student =
      assignment.course.students.find(
        (candidate) => candidate.canvasUserId === file.canvasUserId,
      ) ?? null;
    const existing = byCanvasSubmission.get(file.canvasSubmissionId);
    let decision: ReturnType<typeof canvasSubmissionDecision>;
    try {
      decision = canvasSubmissionDecision(existing?.canvasSubmittedAt, file.submittedAt);
    } catch {
      result.rejected += 1;
      result.warnings.push(`${file.filename} has an invalid Canvas submission date.`);
      continue;
    }
    const { submittedAt } = decision;
    if (decision.action === "unchanged") {
      result.unchanged += 1;
      continue;
    }
    if (
      student &&
      usedStudentIds.has(student.id) &&
      existing?.studentId !== student.id
    ) {
      result.duplicates += 1;
      result.warnings.push(
        `${student.name} already has a submission, so ${file.filename} was skipped.`,
      );
      continue;
    }

    try {
      const bytes = await downloadCanvasSubmissionFile(credentials, file);
      const extracted = await extractDocument(file.filename, bytes);
      const storedPath = await saveUpload(assignmentId, file.filename, bytes);
      const matchStatus = student ? "matched" : "unmatched";
      const studentLabel = student?.name ?? `Canvas user ${file.canvasUserId}`;

      if (existing) {
        await prisma.$transaction([
          prisma.gradeResult.deleteMany({ where: { submissionId: existing.id } }),
          prisma.submission.update({
            where: { id: existing.id },
            data: {
              studentId: student?.id ?? null,
              studentLabel,
              originalName: file.filename,
              storedPath,
              extractedText: extracted.text,
              extractWarning: extracted.warning,
              canvasSubmittedAt: submittedAt,
              matchStatus,
              matchMethod: student ? "canvas_user_id" : null,
              status: "uploaded",
            },
          }),
        ]);
        result.updated += 1;
        if (existing.gradeResult) {
          result.warnings.push(`${studentLabel} submitted new work and now requires regrading.`);
        }
      } else {
        const created = await prisma.submission.create({
          data: {
            assignmentId,
            studentId: student?.id ?? null,
            studentLabel,
            originalName: file.filename,
            storedPath,
            extractedText: extracted.text,
            extractWarning: extracted.warning,
            source: "canvas",
            canvasSubmissionId: file.canvasSubmissionId,
            canvasSubmittedAt: submittedAt,
            matchStatus,
            matchMethod: student ? "canvas_user_id" : null,
          },
        });
        byCanvasSubmission.set(file.canvasSubmissionId, {
          ...created,
          gradeResult: null,
        });
        result.imported += 1;
      }
      if (student) usedStudentIds.add(student.id);
      if (!student) result.unmatched += 1;
      if (extracted.warning) {
        result.warnings.push(`${file.filename}: ${extracted.warning}`);
      }
    } catch (error) {
      result.rejected += 1;
      result.warnings.push(
        error instanceof Error ? `${file.filename}: ${error.message}` : `${file.filename} could not be imported.`,
      );
    }
  }

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: { canvasAssignmentId: canvasAssignmentId.trim() },
  });
  return result;
}
