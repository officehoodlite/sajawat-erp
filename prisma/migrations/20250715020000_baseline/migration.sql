-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('PENDING', 'IN_PRODUCTION', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ProductionStage" AS ENUM ('CARPENTRY', 'PAINTING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "WorkerEntryType" AS ENUM ('MANUFACTURING', 'PACKING');

-- CreateEnum
CREATE TYPE "Unit" AS ENUM ('PCS', 'KG', 'LTR', 'ML', 'MTR', 'SQFT', 'BOX', 'ROLL', 'SHEET');

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactNumber" TEXT,
    "address" TEXT,
    "gstNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardThickness" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "thickness" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardThickness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardInventory" (
    "id" TEXT NOT NULL,
    "boardThicknessId" TEXT NOT NULL,
    "purchaseSqft" DECIMAL(18,6) NOT NULL,
    "remainingSqft" DECIMAL(18,6) NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "supplierId" TEXT,
    "rate" DECIMAL(18,6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaintProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "unit" "Unit" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "remainingStock" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaintProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaintPurchase" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "supplierId" TEXT,
    "invoiceNumber" TEXT,
    "quantity" DECIMAL(18,6) NOT NULL,
    "remainingQuantity" DECIMAL(18,6) NOT NULL,
    "rate" DECIMAL(18,6),
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaintPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaintConsumptionLog" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "remainingAfter" DECIMAL(18,6) NOT NULL,
    "consumedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaintConsumptionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HardwareProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "unit" "Unit" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "remainingStock" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HardwareProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HardwarePurchase" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "supplierId" TEXT,
    "invoiceNumber" TEXT,
    "quantity" DECIMAL(18,6) NOT NULL,
    "remainingQuantity" DECIMAL(18,6) NOT NULL,
    "rate" DECIMAL(18,6),
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HardwarePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HardwareConsumptionLog" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "remainingAfter" DECIMAL(18,6) NOT NULL,
    "consumedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HardwareConsumptionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "unit" "Unit" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "remainingStock" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackingProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingPurchase" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "supplierId" TEXT,
    "invoiceNumber" TEXT,
    "quantity" DECIMAL(18,6) NOT NULL,
    "remainingQuantity" DECIMAL(18,6) NOT NULL,
    "rate" DECIMAL(18,6),
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackingPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingConsumptionLog" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "remainingAfter" DECIMAL(18,6) NOT NULL,
    "consumedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackingConsumptionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductModel" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManufacturingLot" (
    "id" TEXT NOT NULL,
    "lotNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "status" "LotStatus" NOT NULL DEFAULT 'PENDING',
    "stockDeducted" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManufacturingLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManufacturingModel" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "catalogModelId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "partCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManufacturingModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionEntry" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "manufacturingModelId" TEXT NOT NULL,
    "parts" TEXT[],
    "details" TEXT NOT NULL,
    "statusText" TEXT,
    "description" TEXT,
    "stage" "ProductionStage" NOT NULL DEFAULT 'CARPENTRY',
    "carpentryQty" INTEGER NOT NULL,
    "paintingStatusQty" INTEGER NOT NULL DEFAULT 0,
    "completedOutQty" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManufacturingBoardEntry" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "boardInventoryId" TEXT NOT NULL,
    "length" DECIMAL(16,6) NOT NULL,
    "width" DECIMAL(16,6) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sqftPerPiece" DECIMAL(18,6) NOT NULL,
    "totalSqft" DECIMAL(18,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManufacturingBoardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManufacturingPaintEntry" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "paintProductId" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManufacturingPaintEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManufacturingHardwareEntry" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "hardwareProductId" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManufacturingHardwareEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManufacturingPackingEntry" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "packingProductId" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManufacturingPackingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotActualBoardEntry" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "boardThicknessId" TEXT NOT NULL,
    "length" DECIMAL(16,6) NOT NULL DEFAULT 0,
    "width" DECIMAL(16,6) NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "sqftIn" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "sqftOut" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "totalSqft" DECIMAL(18,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LotActualBoardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotWorkerRates" (
    "lotId" TEXT NOT NULL,
    "mfgMistriRate" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "mfgHalfMistriRate" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "mfgHelperRate" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "packingMistriRate" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "packingHalfMistriRate" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "packingHelperRate" DECIMAL(18,6) NOT NULL DEFAULT 0,

    CONSTRAINT "LotWorkerRates_pkey" PRIMARY KEY ("lotId")
);

-- CreateTable
CREATE TABLE "LotWorkerEntry" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "type" "WorkerEntryType" NOT NULL,
    "workDate" TIMESTAMP(3) NOT NULL,
    "workerNames" TEXT[],
    "machinery" TEXT,
    "mistri" INTEGER NOT NULL DEFAULT 0,
    "halfMistri" INTEGER NOT NULL DEFAULT 0,
    "helper" INTEGER NOT NULL DEFAULT 0,
    "hours" INTEGER NOT NULL,
    "packQty" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LotWorkerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_name_key" ON "Supplier"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Board_materialName_key" ON "Board"("materialName");

-- CreateIndex
CREATE UNIQUE INDEX "BoardThickness_boardId_thickness_key" ON "BoardThickness"("boardId", "thickness");

-- CreateIndex
CREATE UNIQUE INDEX "PaintProduct_name_key" ON "PaintProduct"("name");

-- CreateIndex
CREATE INDEX "PaintPurchase_productId_idx" ON "PaintPurchase"("productId");

-- CreateIndex
CREATE INDEX "PaintPurchase_purchaseDate_idx" ON "PaintPurchase"("purchaseDate");

-- CreateIndex
CREATE INDEX "PaintConsumptionLog_productId_idx" ON "PaintConsumptionLog"("productId");

-- CreateIndex
CREATE INDEX "PaintConsumptionLog_consumedAt_idx" ON "PaintConsumptionLog"("consumedAt");

-- CreateIndex
CREATE INDEX "PaintConsumptionLog_lotId_idx" ON "PaintConsumptionLog"("lotId");

-- CreateIndex
CREATE UNIQUE INDEX "HardwareProduct_name_key" ON "HardwareProduct"("name");

-- CreateIndex
CREATE INDEX "HardwarePurchase_productId_idx" ON "HardwarePurchase"("productId");

-- CreateIndex
CREATE INDEX "HardwarePurchase_purchaseDate_idx" ON "HardwarePurchase"("purchaseDate");

-- CreateIndex
CREATE INDEX "HardwareConsumptionLog_productId_idx" ON "HardwareConsumptionLog"("productId");

-- CreateIndex
CREATE INDEX "HardwareConsumptionLog_consumedAt_idx" ON "HardwareConsumptionLog"("consumedAt");

-- CreateIndex
CREATE INDEX "HardwareConsumptionLog_lotId_idx" ON "HardwareConsumptionLog"("lotId");

-- CreateIndex
CREATE UNIQUE INDEX "PackingProduct_name_key" ON "PackingProduct"("name");

-- CreateIndex
CREATE INDEX "PackingPurchase_productId_idx" ON "PackingPurchase"("productId");

-- CreateIndex
CREATE INDEX "PackingPurchase_purchaseDate_idx" ON "PackingPurchase"("purchaseDate");

-- CreateIndex
CREATE INDEX "PackingConsumptionLog_productId_idx" ON "PackingConsumptionLog"("productId");

-- CreateIndex
CREATE INDEX "PackingConsumptionLog_consumedAt_idx" ON "PackingConsumptionLog"("consumedAt");

-- CreateIndex
CREATE INDEX "PackingConsumptionLog_lotId_idx" ON "PackingConsumptionLog"("lotId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductModel_productId_modelName_key" ON "ProductModel"("productId", "modelName");

-- CreateIndex
CREATE UNIQUE INDEX "ManufacturingLot_lotNumber_key" ON "ManufacturingLot"("lotNumber");

-- CreateIndex
CREATE INDEX "ProductionEntry_lotId_idx" ON "ProductionEntry"("lotId");

-- CreateIndex
CREATE INDEX "ProductionEntry_manufacturingModelId_idx" ON "ProductionEntry"("manufacturingModelId");

-- CreateIndex
CREATE INDEX "LotActualBoardEntry_lotId_idx" ON "LotActualBoardEntry"("lotId");

-- CreateIndex
CREATE INDEX "LotActualBoardEntry_boardThicknessId_idx" ON "LotActualBoardEntry"("boardThicknessId");

-- CreateIndex
CREATE INDEX "LotWorkerEntry_lotId_idx" ON "LotWorkerEntry"("lotId");

-- AddForeignKey
ALTER TABLE "BoardThickness" ADD CONSTRAINT "BoardThickness_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardInventory" ADD CONSTRAINT "BoardInventory_boardThicknessId_fkey" FOREIGN KEY ("boardThicknessId") REFERENCES "BoardThickness"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardInventory" ADD CONSTRAINT "BoardInventory_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaintPurchase" ADD CONSTRAINT "PaintPurchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "PaintProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaintPurchase" ADD CONSTRAINT "PaintPurchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaintConsumptionLog" ADD CONSTRAINT "PaintConsumptionLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "PaintProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaintConsumptionLog" ADD CONSTRAINT "PaintConsumptionLog_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "ManufacturingLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaintConsumptionLog" ADD CONSTRAINT "PaintConsumptionLog_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ManufacturingModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwarePurchase" ADD CONSTRAINT "HardwarePurchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "HardwareProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwarePurchase" ADD CONSTRAINT "HardwarePurchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwareConsumptionLog" ADD CONSTRAINT "HardwareConsumptionLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "HardwareProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwareConsumptionLog" ADD CONSTRAINT "HardwareConsumptionLog_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "ManufacturingLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwareConsumptionLog" ADD CONSTRAINT "HardwareConsumptionLog_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ManufacturingModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingPurchase" ADD CONSTRAINT "PackingPurchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "PackingProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingPurchase" ADD CONSTRAINT "PackingPurchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingConsumptionLog" ADD CONSTRAINT "PackingConsumptionLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "PackingProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingConsumptionLog" ADD CONSTRAINT "PackingConsumptionLog_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "ManufacturingLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingConsumptionLog" ADD CONSTRAINT "PackingConsumptionLog_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ManufacturingModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductModel" ADD CONSTRAINT "ProductModel_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingModel" ADD CONSTRAINT "ManufacturingModel_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "ManufacturingLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingModel" ADD CONSTRAINT "ManufacturingModel_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingModel" ADD CONSTRAINT "ManufacturingModel_catalogModelId_fkey" FOREIGN KEY ("catalogModelId") REFERENCES "ProductModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionEntry" ADD CONSTRAINT "ProductionEntry_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "ManufacturingLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionEntry" ADD CONSTRAINT "ProductionEntry_manufacturingModelId_fkey" FOREIGN KEY ("manufacturingModelId") REFERENCES "ManufacturingModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingBoardEntry" ADD CONSTRAINT "ManufacturingBoardEntry_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ManufacturingModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingBoardEntry" ADD CONSTRAINT "ManufacturingBoardEntry_boardInventoryId_fkey" FOREIGN KEY ("boardInventoryId") REFERENCES "BoardInventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingPaintEntry" ADD CONSTRAINT "ManufacturingPaintEntry_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ManufacturingModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingPaintEntry" ADD CONSTRAINT "ManufacturingPaintEntry_paintProductId_fkey" FOREIGN KEY ("paintProductId") REFERENCES "PaintProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingHardwareEntry" ADD CONSTRAINT "ManufacturingHardwareEntry_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ManufacturingModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingHardwareEntry" ADD CONSTRAINT "ManufacturingHardwareEntry_hardwareProductId_fkey" FOREIGN KEY ("hardwareProductId") REFERENCES "HardwareProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingPackingEntry" ADD CONSTRAINT "ManufacturingPackingEntry_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ManufacturingModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingPackingEntry" ADD CONSTRAINT "ManufacturingPackingEntry_packingProductId_fkey" FOREIGN KEY ("packingProductId") REFERENCES "PackingProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotActualBoardEntry" ADD CONSTRAINT "LotActualBoardEntry_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "ManufacturingLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotActualBoardEntry" ADD CONSTRAINT "LotActualBoardEntry_boardThicknessId_fkey" FOREIGN KEY ("boardThicknessId") REFERENCES "BoardThickness"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotWorkerRates" ADD CONSTRAINT "LotWorkerRates_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "ManufacturingLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotWorkerEntry" ADD CONSTRAINT "LotWorkerEntry_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "ManufacturingLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

