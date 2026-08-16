-- AlterTable
ALTER TABLE "ProductModelBoardPreset" ADD COLUMN "length" DECIMAL(16,6) NOT NULL DEFAULT 0;
ALTER TABLE "ProductModelBoardPreset" ADD COLUMN "width" DECIMAL(16,6) NOT NULL DEFAULT 0;
ALTER TABLE "ProductModelBoardPreset" ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "ProductModelPaintPreset" ADD COLUMN "quantity" DECIMAL(18,6) NOT NULL DEFAULT 0;
ALTER TABLE "ProductModelHardwarePreset" ADD COLUMN "quantity" DECIMAL(18,6) NOT NULL DEFAULT 0;
ALTER TABLE "ProductModelPackingPreset" ADD COLUMN "quantity" DECIMAL(18,6) NOT NULL DEFAULT 0;

ALTER TABLE "ManufacturingModelBoardPreset" ADD COLUMN "length" DECIMAL(16,6) NOT NULL DEFAULT 0;
ALTER TABLE "ManufacturingModelBoardPreset" ADD COLUMN "width" DECIMAL(16,6) NOT NULL DEFAULT 0;
ALTER TABLE "ManufacturingModelBoardPreset" ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "ManufacturingModelPaintPreset" ADD COLUMN "quantity" DECIMAL(18,6) NOT NULL DEFAULT 0;
ALTER TABLE "ManufacturingModelHardwarePreset" ADD COLUMN "quantity" DECIMAL(18,6) NOT NULL DEFAULT 0;
ALTER TABLE "ManufacturingModelPackingPreset" ADD COLUMN "quantity" DECIMAL(18,6) NOT NULL DEFAULT 0;
