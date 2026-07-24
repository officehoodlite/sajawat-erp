-- AlterTable
ALTER TABLE "ProductionEntry" ADD COLUMN "paintingReadyQty" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ProductionEntry" ADD COLUMN "completedReadyQty" INTEGER NOT NULL DEFAULT 0;

-- Backfill from previous stage-derived display values
UPDATE "ProductionEntry"
SET
  "paintingReadyQty" = CASE
    WHEN "stage" IN ('CARPENTRY', 'FOR_PAINT', 'IN_PAINT') THEN "carpentryQty"
    ELSE 0
  END,
  "paintingStatusQty" = CASE
    WHEN "stage" = 'IN_PAINT' THEN "carpentryQty"
    WHEN "stage" IN ('IN_STOCK', 'READY') THEN 0
    ELSE 0
  END,
  "completedReadyQty" = CASE
    WHEN "stage" IN ('IN_STOCK', 'READY') THEN "carpentryQty"
    ELSE 0
  END,
  "completedOutQty" = CASE
    WHEN "stage" = 'READY' THEN "carpentryQty"
    ELSE 0
  END;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ManufacturingModel_catalogModelId_idx" ON "ManufacturingModel"("catalogModelId");
