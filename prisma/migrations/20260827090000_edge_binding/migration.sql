-- CreateTable
CREATE TABLE "EdgeBindingProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "unit" "Unit" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "remainingStock" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EdgeBindingProduct_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EdgeBindingProduct_name_key" ON "EdgeBindingProduct"("name");

CREATE TABLE "EdgeBindingPurchase" (
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

    CONSTRAINT "EdgeBindingPurchase_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EdgeBindingPurchase_productId_idx" ON "EdgeBindingPurchase"("productId");
CREATE INDEX "EdgeBindingPurchase_purchaseDate_idx" ON "EdgeBindingPurchase"("purchaseDate");

CREATE TABLE "EdgeBindingConsumptionLog" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "remainingAfter" DECIMAL(18,6) NOT NULL,
    "consumedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EdgeBindingConsumptionLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EdgeBindingConsumptionLog_productId_idx" ON "EdgeBindingConsumptionLog"("productId");
CREATE INDEX "EdgeBindingConsumptionLog_consumedAt_idx" ON "EdgeBindingConsumptionLog"("consumedAt");
CREATE INDEX "EdgeBindingConsumptionLog_lotId_idx" ON "EdgeBindingConsumptionLog"("lotId");

CREATE TABLE "ProductModelEdgeBindingPreset" (
    "id" TEXT NOT NULL,
    "productModelId" TEXT NOT NULL,
    "edgeBindingProductId" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductModelEdgeBindingPreset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductModelEdgeBindingPreset_productModelId_idx" ON "ProductModelEdgeBindingPreset"("productModelId");

CREATE TABLE "ManufacturingModelEdgeBindingPreset" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "edgeBindingProductId" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManufacturingModelEdgeBindingPreset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ManufacturingModelEdgeBindingPreset_modelId_idx" ON "ManufacturingModelEdgeBindingPreset"("modelId");

CREATE TABLE "ManufacturingEdgeBindingEntry" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "edgeBindingProductId" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManufacturingEdgeBindingEntry_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "EdgeBindingPurchase" ADD CONSTRAINT "EdgeBindingPurchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "EdgeBindingProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EdgeBindingPurchase" ADD CONSTRAINT "EdgeBindingPurchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EdgeBindingConsumptionLog" ADD CONSTRAINT "EdgeBindingConsumptionLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "EdgeBindingProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EdgeBindingConsumptionLog" ADD CONSTRAINT "EdgeBindingConsumptionLog_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "ManufacturingLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EdgeBindingConsumptionLog" ADD CONSTRAINT "EdgeBindingConsumptionLog_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ManufacturingModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductModelEdgeBindingPreset" ADD CONSTRAINT "ProductModelEdgeBindingPreset_productModelId_fkey" FOREIGN KEY ("productModelId") REFERENCES "ProductModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductModelEdgeBindingPreset" ADD CONSTRAINT "ProductModelEdgeBindingPreset_edgeBindingProductId_fkey" FOREIGN KEY ("edgeBindingProductId") REFERENCES "EdgeBindingProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ManufacturingModelEdgeBindingPreset" ADD CONSTRAINT "ManufacturingModelEdgeBindingPreset_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ManufacturingModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ManufacturingModelEdgeBindingPreset" ADD CONSTRAINT "ManufacturingModelEdgeBindingPreset_edgeBindingProductId_fkey" FOREIGN KEY ("edgeBindingProductId") REFERENCES "EdgeBindingProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ManufacturingEdgeBindingEntry" ADD CONSTRAINT "ManufacturingEdgeBindingEntry_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ManufacturingModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ManufacturingEdgeBindingEntry" ADD CONSTRAINT "ManufacturingEdgeBindingEntry_edgeBindingProductId_fkey" FOREIGN KEY ("edgeBindingProductId") REFERENCES "EdgeBindingProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
