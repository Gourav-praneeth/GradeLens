-- AlterTable
ALTER TABLE "CriterionScore" ADD COLUMN "modelPointsAwarded" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "CriterionScore" ADD COLUMN "overrideNote" TEXT;
UPDATE "CriterionScore" SET "modelPointsAwarded" = "pointsAwarded";
