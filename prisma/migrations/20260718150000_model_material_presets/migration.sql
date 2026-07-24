-- CreateTable
CREATE TABLE "ProductModelBoardPreset" (
    "id" TEXT NOT NULL,
    "productModelId" TEXT NOT NULL,
    "boardThicknessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductModelBoardPreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductModelPaintPreset" (
    "id" TEXT NOT NULL,
    "productModelId" TEXT NOT NULL,
    "paintProductId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductModelPaintPreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductModelHardwarePreset" (
    "id" TEXT NOT NULL,
    "productModelId" TEXT NOT NULL,
    "hardwareProductId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductModelHardwarePreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductModelPackingPreset" (
    "id" TEXT NOT NULL,
    "productModelId" TEXT NOT NULL,
    "packingProductId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductModelPackingPreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManufacturingModelBoardPreset" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "boardThicknessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManufacturingModelBoardPreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManufacturingModelPaintPreset" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "paintProductId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManufacturingModelPaintPreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManufacturingModelHardwarePreset" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "hardwareProductId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManufacturingModelHardwarePreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManufacturingModelPackingPreset" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "packingProductId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManufacturingModelPackingPreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductModelBoardPreset_productModelId_idx" ON "ProductModelBoardPreset"("productModelId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductModelBoardPreset_productModelId_boardThicknessId_key" ON "ProductModelBoardPreset"("productModelId", "boardThicknessId");

-- CreateIndex
CREATE INDEX "ProductModelPaintPreset_productModelId_idx" ON "ProductModelPaintPreset"("productModelId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductModelPaintPreset_productModelId_paintProductId_key" ON "ProductModelPaintPreset"("productModelId", "paintProductId");

-- CreateIndex
CREATE INDEX "ProductModelHardwarePreset_productModelId_idx" ON "ProductModelHardwarePreset"("productModelId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductModelHardwarePreset_productModelId_hardwareProductId_key" ON "ProductModelHardwarePreset"("productModelId", "hardwareProductId");

-- CreateIndex
CREATE INDEX "ProductModelPackingPreset_productModelId_idx" ON "ProductModelPackingPreset"("productModelId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductModelPackingPreset_productModelId_packingProductId_key" ON "ProductModelPackingPreset"("productModelId", "packingProductId");

-- CreateIndex
CREATE INDEX "ManufacturingModelBoardPreset_modelId_idx" ON "ManufacturingModelBoardPreset"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "ManufacturingModelBoardPreset_modelId_boardThicknessId_key" ON "ManufacturingModelBoardPreset"("modelId", "boardThicknessId");

-- CreateIndex
CREATE INDEX "ManufacturingModelPaintPreset_modelId_idx" ON "ManufacturingModelPaintPreset"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "ManufacturingModelPaintPreset_modelId_paintProductId_key" ON "ManufacturingModelPaintPreset"("modelId", "paintProductId");

-- CreateIndex
CREATE INDEX "ManufacturingModelHardwarePreset_modelId_idx" ON "ManufacturingModelHardwarePreset"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "ManufacturingModelHardwarePreset_modelId_hardwareProductId_key" ON "ManufacturingModelHardwarePreset"("modelId", "hardwareProductId");

-- CreateIndex
CREATE INDEX "ManufacturingModelPackingPreset_modelId_idx" ON "ManufacturingModelPackingPreset"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "ManufacturingModelPackingPreset_modelId_packingProductId_key" ON "ManufacturingModelPackingPreset"("modelId", "packingProductId");

-- AddForeignKey
ALTER TABLE "ProductModelBoardPreset" ADD CONSTRAINT "ProductModelBoardPreset_productModelId_fkey" FOREIGN KEY ("productModelId") REFERENCES "ProductModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductModelBoardPreset" ADD CONSTRAINT "ProductModelBoardPreset_boardThicknessId_fkey" FOREIGN KEY ("boardThicknessId") REFERENCES "BoardThickness"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductModelPaintPreset" ADD CONSTRAINT "ProductModelPaintPreset_productModelId_fkey" FOREIGN KEY ("productModelId") REFERENCES "ProductModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductModelPaintPreset" ADD CONSTRAINT "ProductModelPaintPreset_paintProductId_fkey" FOREIGN KEY ("paintProductId") REFERENCES "PaintProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductModelHardwarePreset" ADD CONSTRAINT "ProductModelHardwarePreset_productModelId_fkey" FOREIGN KEY ("productModelId") REFERENCES "ProductModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductModelHardwarePreset" ADD CONSTRAINT "ProductModelHardwarePreset_hardwareProductId_fkey" FOREIGN KEY ("hardwareProductId") REFERENCES "HardwareProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductModelPackingPreset" ADD CONSTRAINT "ProductModelPackingPreset_productModelId_fkey" FOREIGN KEY ("productModelId") REFERENCES "ProductModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductModelPackingPreset" ADD CONSTRAINT "ProductModelPackingPreset_packingProductId_fkey" FOREIGN KEY ("packingProductId") REFERENCES "PackingProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingModelBoardPreset" ADD CONSTRAINT "ManufacturingModelBoardPreset_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ManufacturingModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingModelBoardPreset" ADD CONSTRAINT "ManufacturingModelBoardPreset_boardThicknessId_fkey" FOREIGN KEY ("boardThicknessId") REFERENCES "BoardThickness"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingModelPaintPreset" ADD CONSTRAINT "ManufacturingModelPaintPreset_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ManufacturingModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingModelPaintPreset" ADD CONSTRAINT "ManufacturingModelPaintPreset_paintProductId_fkey" FOREIGN KEY ("paintProductId") REFERENCES "PaintProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingModelHardwarePreset" ADD CONSTRAINT "ManufacturingModelHardwarePreset_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ManufacturingModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingModelHardwarePreset" ADD CONSTRAINT "ManufacturingModelHardwarePreset_hardwareProductId_fkey" FOREIGN KEY ("hardwareProductId") REFERENCES "HardwareProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingModelPackingPreset" ADD CONSTRAINT "ManufacturingModelPackingPreset_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ManufacturingModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingModelPackingPreset" ADD CONSTRAINT "ManufacturingModelPackingPreset_packingProductId_fkey" FOREIGN KEY ("packingProductId") REFERENCES "PackingProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
