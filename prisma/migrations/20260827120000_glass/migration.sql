CREATE TABLE "GlassProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "unit" "Unit" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "remainingStock" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlassProduct_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GlassProduct_name_key" ON "GlassProduct"("name");

CREATE TABLE "GlassPurchase" (
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

    CONSTRAINT "GlassPurchase_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GlassPurchase_productId_idx" ON "GlassPurchase"("productId");
CREATE INDEX "GlassPurchase_purchaseDate_idx" ON "GlassPurchase"("purchaseDate");

CREATE TABLE "GlassConsumptionLog" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "remainingAfter" DECIMAL(18,6) NOT NULL,
    "consumedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlassConsumptionLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GlassConsumptionLog_productId_idx" ON "GlassConsumptionLog"("productId");
CREATE INDEX "GlassConsumptionLog_consumedAt_idx" ON "GlassConsumptionLog"("consumedAt");
CREATE INDEX "GlassConsumptionLog_lotId_idx" ON "GlassConsumptionLog"("lotId");

CREATE TABLE "ProductModelGlassPreset" (
    "id" TEXT NOT NULL,
    "productModelId" TEXT NOT NULL,
    "glassProductId" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductModelGlassPreset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductModelGlassPreset_productModelId_idx" ON "ProductModelGlassPreset"("productModelId");

CREATE TABLE "ManufacturingModelGlassPreset" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "glassProductId" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManufacturingModelGlassPreset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ManufacturingModelGlassPreset_modelId_idx" ON "ManufacturingModelGlassPreset"("modelId");

CREATE TABLE "ManufacturingGlassEntry" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "glassProductId" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManufacturingGlassEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ManufacturingGlassEntry_modelId_idx" ON "ManufacturingGlassEntry"("modelId");

ALTER TABLE "GlassPurchase" ADD CONSTRAINT "GlassPurchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "GlassProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GlassPurchase" ADD CONSTRAINT "GlassPurchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GlassConsumptionLog" ADD CONSTRAINT "GlassConsumptionLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "GlassProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GlassConsumptionLog" ADD CONSTRAINT "GlassConsumptionLog_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "ManufacturingLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GlassConsumptionLog" ADD CONSTRAINT "GlassConsumptionLog_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ManufacturingModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductModelGlassPreset" ADD CONSTRAINT "ProductModelGlassPreset_productModelId_fkey" FOREIGN KEY ("productModelId") REFERENCES "ProductModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductModelGlassPreset" ADD CONSTRAINT "ProductModelGlassPreset_glassProductId_fkey" FOREIGN KEY ("glassProductId") REFERENCES "GlassProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ManufacturingModelGlassPreset" ADD CONSTRAINT "ManufacturingModelGlassPreset_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ManufacturingModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ManufacturingModelGlassPreset" ADD CONSTRAINT "ManufacturingModelGlassPreset_glassProductId_fkey" FOREIGN KEY ("glassProductId") REFERENCES "GlassProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ManufacturingGlassEntry" ADD CONSTRAINT "ManufacturingGlassEntry_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ManufacturingModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ManufacturingGlassEntry" ADD CONSTRAINT "ManufacturingGlassEntry_glassProductId_fkey" FOREIGN KEY ("glassProductId") REFERENCES "GlassProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
