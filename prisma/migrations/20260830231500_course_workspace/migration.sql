-- AlterTable
ALTER TABLE "Course" ADD COLUMN "semester" TEXT;
ALTER TABLE "Course" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Course" ADD COLUMN "accent" TEXT NOT NULL DEFAULT '#1c4d4a';
ALTER TABLE "Course" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN "studentNumber" TEXT;

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Assignment" ADD COLUMN "dueAt" DATETIME;
