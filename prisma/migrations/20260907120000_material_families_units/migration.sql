ALTER TYPE "Unit" ADD VALUE 'FEET';
ALTER TYPE "Unit" ADD VALUE 'SET';

CREATE TABLE "PaintFamily" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaintFamily_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PaintFamily_name_key" ON "PaintFamily"("name");

CREATE TABLE "HardwareFamily" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HardwareFamily_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "HardwareFamily_name_key" ON "HardwareFamily"("name");

CREATE TABLE "PackingFamily" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackingFamily_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PackingFamily_name_key" ON "PackingFamily"("name");

CREATE TABLE "EdgeBindingFamily" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EdgeBindingFamily_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EdgeBindingFamily_name_key" ON "EdgeBindingFamily"("name");

CREATE TABLE "GlassFamily" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlassFamily_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GlassFamily_name_key" ON "GlassFamily"("name");

INSERT INTO "PaintFamily" ("id", "name", "createdAt", "updatedAt")
SELECT "id", "name", "createdAt", "updatedAt" FROM "PaintProduct";

INSERT INTO "HardwareFamily" ("id", "name", "createdAt", "updatedAt")
SELECT "id", "name", "createdAt", "updatedAt" FROM "HardwareProduct";

INSERT INTO "PackingFamily" ("id", "name", "createdAt", "updatedAt")
SELECT "id", "name", "createdAt", "updatedAt" FROM "PackingProduct";

INSERT INTO "EdgeBindingFamily" ("id", "name", "createdAt", "updatedAt")
SELECT "id", "name", "createdAt", "updatedAt" FROM "EdgeBindingProduct";

INSERT INTO "GlassFamily" ("id", "name", "createdAt", "updatedAt")
SELECT "id", "name", "createdAt", "updatedAt" FROM "GlassProduct";

ALTER TABLE "PaintProduct" ADD COLUMN "familyId" TEXT;
ALTER TABLE "HardwareProduct" ADD COLUMN "familyId" TEXT;
ALTER TABLE "PackingProduct" ADD COLUMN "familyId" TEXT;
ALTER TABLE "EdgeBindingProduct" ADD COLUMN "familyId" TEXT;
ALTER TABLE "GlassProduct" ADD COLUMN "familyId" TEXT;

UPDATE "PaintProduct" SET "familyId" = "id";
UPDATE "HardwareProduct" SET "familyId" = "id";
UPDATE "PackingProduct" SET "familyId" = "id";
UPDATE "EdgeBindingProduct" SET "familyId" = "id";
UPDATE "GlassProduct" SET "familyId" = "id";

ALTER TABLE "PaintProduct" ALTER COLUMN "familyId" SET NOT NULL;
ALTER TABLE "HardwareProduct" ALTER COLUMN "familyId" SET NOT NULL;
ALTER TABLE "PackingProduct" ALTER COLUMN "familyId" SET NOT NULL;
ALTER TABLE "EdgeBindingProduct" ALTER COLUMN "familyId" SET NOT NULL;
ALTER TABLE "GlassProduct" ALTER COLUMN "familyId" SET NOT NULL;

DROP INDEX "PaintProduct_name_key";
DROP INDEX "HardwareProduct_name_key";
DROP INDEX "PackingProduct_name_key";
DROP INDEX "EdgeBindingProduct_name_key";
DROP INDEX "GlassProduct_name_key";

CREATE UNIQUE INDEX "PaintProduct_familyId_name_key" ON "PaintProduct"("familyId", "name");
CREATE UNIQUE INDEX "HardwareProduct_familyId_name_key" ON "HardwareProduct"("familyId", "name");
CREATE UNIQUE INDEX "PackingProduct_familyId_name_key" ON "PackingProduct"("familyId", "name");
CREATE UNIQUE INDEX "EdgeBindingProduct_familyId_name_key" ON "EdgeBindingProduct"("familyId", "name");
CREATE UNIQUE INDEX "GlassProduct_familyId_name_key" ON "GlassProduct"("familyId", "name");

CREATE INDEX "PaintProduct_familyId_idx" ON "PaintProduct"("familyId");
CREATE INDEX "HardwareProduct_familyId_idx" ON "HardwareProduct"("familyId");
CREATE INDEX "PackingProduct_familyId_idx" ON "PackingProduct"("familyId");
CREATE INDEX "EdgeBindingProduct_familyId_idx" ON "EdgeBindingProduct"("familyId");
CREATE INDEX "GlassProduct_familyId_idx" ON "GlassProduct"("familyId");

ALTER TABLE "PaintProduct" ADD CONSTRAINT "PaintProduct_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "PaintFamily"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HardwareProduct" ADD CONSTRAINT "HardwareProduct_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "HardwareFamily"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PackingProduct" ADD CONSTRAINT "PackingProduct_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "PackingFamily"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EdgeBindingProduct" ADD CONSTRAINT "EdgeBindingProduct_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "EdgeBindingFamily"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GlassProduct" ADD CONSTRAINT "GlassProduct_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "GlassFamily"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
