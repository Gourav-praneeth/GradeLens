-- AlterTable
ALTER TABLE "CriterionScore" ADD COLUMN "modelPointsAwarded" REAL NOT NULL DEFAULT 0;
ALTER TABLE "CriterionScore" ADD COLUMN "overrideNote" TEXT;
UPDATE "CriterionScore" SET "modelPointsAwarded" = "pointsAwarded";
