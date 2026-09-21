-- AlterTable
ALTER TABLE "Student" ADD COLUMN "sisLoginId" TEXT;

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN "canvasAssignmentId" TEXT;

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'upload';
ALTER TABLE "Submission" ADD COLUMN "canvasSubmissionId" TEXT;
ALTER TABLE "Submission" ADD COLUMN "canvasSubmittedAt" DATETIME;
ALTER TABLE "Submission" ADD COLUMN "matchMethod" TEXT;
ALTER TABLE "Submission" ADD COLUMN "matchStatus" TEXT NOT NULL DEFAULT 'unmatched';

UPDATE "Submission"
SET "matchStatus" = 'matched', "matchMethod" = 'legacy'
WHERE "studentId" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Submission_assignmentId_canvasSubmissionId_key"
ON "Submission"("assignmentId", "canvasSubmissionId");
