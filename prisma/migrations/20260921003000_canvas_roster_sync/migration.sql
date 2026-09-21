-- AlterTable
ALTER TABLE "User" ADD COLUMN "canvasBaseUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "canvasTokenCipher" TEXT;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN "canvasCourseId" TEXT;
ALTER TABLE "Course" ADD COLUMN "canvasLastSyncedAt" DATETIME;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN "canvasUserId" TEXT;
ALTER TABLE "Student" ADD COLUMN "rosterSource" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "Student" ADD COLUMN "enrollmentStatus" TEXT NOT NULL DEFAULT 'active';

-- CreateIndex
CREATE UNIQUE INDEX "Student_courseId_canvasUserId_key" ON "Student"("courseId", "canvasUserId");
