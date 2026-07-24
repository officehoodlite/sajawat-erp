-- Expand production stages and add workDate

CREATE TYPE "ProductionStage_new" AS ENUM ('CARPENTRY', 'FOR_PAINT', 'IN_PAINT', 'IN_STOCK', 'READY');

ALTER TABLE "ProductionEntry" ALTER COLUMN "stage" DROP DEFAULT;

ALTER TABLE "ProductionEntry"
  ALTER COLUMN "stage" TYPE "ProductionStage_new"
  USING (
    CASE "stage"::text
      WHEN 'PAINTING' THEN 'IN_PAINT'
      WHEN 'COMPLETED' THEN 'READY'
      ELSE 'CARPENTRY'
    END
  )::"ProductionStage_new";

DROP TYPE "ProductionStage";

ALTER TYPE "ProductionStage_new" RENAME TO "ProductionStage";

ALTER TABLE "ProductionEntry" ALTER COLUMN "stage" SET DEFAULT 'CARPENTRY'::"ProductionStage";

ALTER TABLE "ProductionEntry" ADD COLUMN "workDate" TIMESTAMP(3);

UPDATE "ProductionEntry" SET "workDate" = "createdAt" WHERE "workDate" IS NULL;

ALTER TABLE "ProductionEntry" ALTER COLUMN "workDate" SET NOT NULL;

CREATE INDEX "ProductionEntry_workDate_idx" ON "ProductionEntry"("workDate");
