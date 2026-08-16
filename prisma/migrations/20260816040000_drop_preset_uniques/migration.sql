-- Allow the same material more than once on catalog and lot model presets.
DROP INDEX IF EXISTS "ProductModelBoardPreset_productModelId_boardThicknessId_key";
DROP INDEX IF EXISTS "ProductModelPaintPreset_productModelId_paintProductId_key";
DROP INDEX IF EXISTS "ProductModelHardwarePreset_productModelId_hardwareProductId_key";
DROP INDEX IF EXISTS "ProductModelPackingPreset_productModelId_packingProductId_key";
DROP INDEX IF EXISTS "ManufacturingModelBoardPreset_modelId_boardThicknessId_key";
DROP INDEX IF EXISTS "ManufacturingModelPaintPreset_modelId_paintProductId_key";
DROP INDEX IF EXISTS "ManufacturingModelHardwarePreset_modelId_hardwareProductId_key";
DROP INDEX IF EXISTS "ManufacturingModelPackingPreset_modelId_packingProductId_key";
