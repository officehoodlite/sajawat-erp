import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { roundDecimal } from "@/lib/decimal";
import { toNullableNumber, toNumber } from "@/lib/mappers";
import {
  assertDeleteAllowed,
  assertQuantityEditAllowed,
  computeConsumed,
} from "@/lib/purchase-integrity";
import { materialProductLabel } from "@/lib/material-label";
import type {
  MaterialConsumptionDto,
  MaterialFamilyDto,
  MaterialProductDto,
  MaterialPurchaseDto,
  MaterialStockDto,
} from "@/types/material-module";
import type { Unit, MaterialModuleType } from "@/types/enums";
import type {
  CreateMaterialFamilyInput,
  CreateMaterialProductInput,
  CreateMaterialPurchaseInput,
  MaterialListQuery,
  UpdateMaterialFamilyInput,
  UpdateMaterialProductInput,
  UpdateMaterialPurchaseInput,
} from "@/validators/inventory";

type ProductRow = {
  id: string;
  familyId: string;
  name: string;
  brand: string | null;
  unit: Unit;
  description: string | null;
  isActive: boolean;
  remainingStock: unknown;
  createdAt: Date;
  updatedAt: Date;
  family?: { name: string } | null;
};

function unusedError() {
  const err = new Error(
    "Cannot delete this product because it has purchases, consumption, or is used on a model or lot"
  ) as Error & { statusCode?: number };
  err.statusCode = 400;
  return err;
}

function mapProduct(row: ProductRow): MaterialProductDto {
  const familyName = row.family?.name ?? "";
  return {
    id: row.id,
    familyId: row.familyId,
    familyName,
    name: row.name,
    displayName: materialProductLabel(familyName, row.name),
    brand: row.brand,
    unit: row.unit,
    description: row.description,
    isActive: row.isActive,
    remainingStock: toNumber(row.remainingStock),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapStock(row: ProductRow): MaterialStockDto {
  const familyName = row.family?.name ?? "";
  const displayName = materialProductLabel(familyName, row.name);
  return {
    id: row.id,
    name: row.name,
    displayName,
    brand: row.brand,
    unit: row.unit,
    remainingStock: toNumber(row.remainingStock),
    isActive: row.isActive,
  };
}

type PurchaseRow = {
  id: string;
  productId: string;
  product: { name: string; unit: Unit; family?: { name: string } | null };
  supplierId: string | null;
  supplier?: { name: string } | null;
  invoiceNumber: string | null;
  quantity: unknown;
  remainingQuantity: unknown;
  rate: unknown;
  purchaseDate: Date;
  remarks: string | null;
  createdAt: Date;
};

function mapPurchase(row: PurchaseRow): MaterialPurchaseDto {
  const qty = toNumber(row.quantity);
  const remainingQuantity = toNumber(row.remainingQuantity);
  const rate = toNullableNumber(row.rate);
  return {
    id: row.id,
    productId: row.productId,
    productName: materialProductLabel(row.product.family?.name, row.product.name),
    unit: row.product.unit,
    supplierId: row.supplierId,
    supplierName: row.supplier?.name ?? null,
    invoiceNumber: row.invoiceNumber,
    quantity: qty,
    remainingQuantity,
    consumedQuantity: computeConsumed(qty, remainingQuantity),
    rate,
    totalCost: rate != null ? qty * rate : null,
    purchaseDate: row.purchaseDate.toISOString(),
    remarks: row.remarks,
    createdAt: row.createdAt.toISOString(),
  };
}

function buildSearchWhere(search: string) {
  if (!search.trim()) return undefined;
  const q = search.trim();
  return {
    OR: [
      { name: { contains: q, mode: "insensitive" as const } },
      { brand: { contains: q, mode: "insensitive" as const } },
      { family: { name: { contains: q, mode: "insensitive" as const } } },
    ],
  };
}

const familyDelegates = {
  paint: prisma.paintFamily,
  hardware: prisma.hardwareFamily,
  packing: prisma.packingFamily,
  edgebinding: prisma.edgeBindingFamily,
  glass: prisma.glassFamily,
} as const;

const productDelegates = {
  paint: prisma.paintProduct,
  hardware: prisma.hardwareProduct,
  packing: prisma.packingProduct,
  edgebinding: prisma.edgeBindingProduct,
  glass: prisma.glassProduct,
} as const;

const purchaseDelegates = {
  paint: prisma.paintPurchase,
  hardware: prisma.hardwarePurchase,
  packing: prisma.packingPurchase,
  edgebinding: prisma.edgeBindingPurchase,
  glass: prisma.glassPurchase,
} as const;

const consumptionDelegates = {
  paint: prisma.paintConsumptionLog,
  hardware: prisma.hardwareConsumptionLog,
  packing: prisma.packingConsumptionLog,
  edgebinding: prisma.edgeBindingConsumptionLog,
  glass: prisma.glassConsumptionLog,
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDelegate = { [key: string]: (...args: any[]) => any };

export class MaterialModuleRepository {
  constructor(private readonly module: MaterialModuleType) {}

  private get familyDelegate(): AnyDelegate {
    return familyDelegates[this.module] as unknown as AnyDelegate;
  }

  private get productDelegate(): AnyDelegate {
    return productDelegates[this.module] as unknown as AnyDelegate;
  }

  private get purchaseDelegate(): AnyDelegate {
    return purchaseDelegates[this.module] as unknown as AnyDelegate;
  }

  private get consumptionDelegate(): AnyDelegate {
    return consumptionDelegates[this.module] as unknown as AnyDelegate;
  }

  async findFamilies(query: MaterialListQuery) {
    const where = query.search.trim()
      ? { name: { contains: query.search.trim(), mode: "insensitive" as const } }
      : undefined;
    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      this.familyDelegate.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: query.limit,
        include: { _count: { select: { products: true } } },
      }),
      this.familyDelegate.count({ where }),
    ]);

    return {
      items: (
        items as Array<{ id: string; name: string; _count: { products: number } }>
      ).map(
        (row): MaterialFamilyDto => ({
          id: row.id,
          name: row.name,
          productCount: row._count.products,
        })
      ),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  async createFamily(data: CreateMaterialFamilyInput) {
    const row = await this.familyDelegate.create({
      data: { name: data.name.trim() },
    });
    return {
      id: row.id as string,
      name: row.name as string,
      productCount: 0,
    } satisfies MaterialFamilyDto;
  }

  async updateFamily(id: string, data: UpdateMaterialFamilyInput) {
    const row = await this.familyDelegate.update({
      where: { id },
      data: { name: data.name.trim() },
      include: { _count: { select: { products: true } } },
    });
    return {
      id: row.id as string,
      name: row.name as string,
      productCount: (row._count as { products: number }).products,
    } satisfies MaterialFamilyDto;
  }

  async deleteFamily(id: string) {
    const productCount = await this.productDelegate.count({ where: { familyId: id } });
    if (productCount > 0) {
      const err = new Error("Delete all items under this name before deleting it") as Error & {
        statusCode?: number;
      };
      err.statusCode = 400;
      throw err;
    }
    await this.familyDelegate.delete({ where: { id } });
  }

  async findProducts(query: MaterialListQuery) {
    const where = {
      ...buildSearchWhere(query.search),
      ...(query.activeOnly !== undefined ? { isActive: query.activeOnly } : {}),
      ...(query.familyId ? { familyId: query.familyId } : {}),
    };

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      this.productDelegate.findMany({
        where,
        include: { family: true },
        orderBy: { name: "asc" },
        skip,
        take: query.limit,
      }),
      this.productDelegate.count({ where }),
    ]);

    return {
      items: (items as ProductRow[]).map((row) => mapProduct(row)),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  async findProductById(id: string) {
    const row = await this.productDelegate.findUnique({
      where: { id },
      include: { family: true },
    });
    return row ? mapProduct(row as ProductRow) : null;
  }

  async createProduct(data: CreateMaterialProductInput) {
    const row = await this.productDelegate.create({
      data: {
        familyId: data.familyId,
        name: data.name,
        brand: null,
        unit: data.unit,
        description: null,
        isActive: true,
      },
      include: { family: true },
    });
    return mapProduct(row as ProductRow);
  }

  async updateProduct(id: string, data: UpdateMaterialProductInput) {
    const row = await this.productDelegate.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.unit !== undefined ? { unit: data.unit } : {}),
      },
      include: { family: true },
    });
    return mapProduct(row as ProductRow);
  }

  async archiveProduct(id: string) {
    const row = await this.productDelegate.update({
      where: { id },
      data: { isActive: false },
      include: { family: true },
    });
    return mapProduct(row as ProductRow);
  }

  async deleteProduct(id: string) {
    await this.assertProductUnused(id);
    await this.productDelegate.delete({ where: { id } });
  }

  private async assertProductUnused(id: string) {
    if (this.module === "paint") {
      const row = await prisma.paintProduct.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              purchases: true,
              consumptions: true,
              paintEntries: true,
              productModelPaintPresets: true,
              manufacturingPaintPresets: true,
            },
          },
        },
      });
      if (!row) throw new Error("Product not found");
      const c = row._count;
      if (
        c.purchases ||
        c.consumptions ||
        c.paintEntries ||
        c.productModelPaintPresets ||
        c.manufacturingPaintPresets
      ) {
        throw unusedError();
      }
      return;
    }
    if (this.module === "hardware") {
      const row = await prisma.hardwareProduct.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              purchases: true,
              consumptions: true,
              hardwareEntries: true,
              productModelHardwarePresets: true,
              manufacturingHardwarePresets: true,
            },
          },
        },
      });
      if (!row) throw new Error("Product not found");
      const c = row._count;
      if (
        c.purchases ||
        c.consumptions ||
        c.hardwareEntries ||
        c.productModelHardwarePresets ||
        c.manufacturingHardwarePresets
      ) {
        throw unusedError();
      }
      return;
    }
    if (this.module === "edgebinding") {
      const row = await prisma.edgeBindingProduct.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              purchases: true,
              consumptions: true,
              edgeBindingEntries: true,
              productModelEdgeBindingPresets: true,
              manufacturingEdgeBindingPresets: true,
            },
          },
        },
      });
      if (!row) throw new Error("Product not found");
      const c = row._count;
      if (
        c.purchases ||
        c.consumptions ||
        c.edgeBindingEntries ||
        c.productModelEdgeBindingPresets ||
        c.manufacturingEdgeBindingPresets
      ) {
        throw unusedError();
      }
      return;
    }
    if (this.module === "glass") {
      const row = await prisma.glassProduct.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              purchases: true,
              consumptions: true,
              glassEntries: true,
              productModelGlassPresets: true,
              manufacturingGlassPresets: true,
            },
          },
        },
      });
      if (!row) throw new Error("Product not found");
      const c = row._count;
      if (
        c.purchases ||
        c.consumptions ||
        c.glassEntries ||
        c.productModelGlassPresets ||
        c.manufacturingGlassPresets
      ) {
        throw unusedError();
      }
      return;
    }
    const row = await prisma.packingProduct.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            purchases: true,
            consumptions: true,
            packingEntries: true,
            productModelPackingPresets: true,
            manufacturingPackingPresets: true,
          },
        },
      },
    });
    if (!row) throw new Error("Product not found");
    const c = row._count;
    if (
      c.purchases ||
      c.consumptions ||
      c.packingEntries ||
      c.productModelPackingPresets ||
      c.manufacturingPackingPresets
    ) {
      throw unusedError();
    }
  }

  async findStock() {
    const rows = await this.productDelegate.findMany({
      include: { family: true },
      orderBy: { name: "asc" },
    });
    return (rows as ProductRow[]).map((row) => mapStock(row));
  }

  async findPurchases(query: MaterialListQuery) {
    const productFilter = query.productId ? { productId: query.productId } : {};
    const searchFilter = query.search.trim()
      ? {
          OR: [
            { supplier: { name: { contains: query.search.trim(), mode: "insensitive" as const } } },
            { invoiceNumber: { contains: query.search.trim(), mode: "insensitive" as const } },
            {
              product: {
                name: { contains: query.search.trim(), mode: "insensitive" as const },
              },
            },
          ],
        }
      : {};

    const where = { ...productFilter, ...searchFilter };
    const skip = (query.page - 1) * query.limit;

    const [rows, total] = await Promise.all([
      this.purchaseDelegate.findMany({
        where,
        include: { product: { include: { family: true } }, supplier: true },
        orderBy: { purchaseDate: "desc" },
        skip,
        take: query.limit,
      }),
      this.purchaseDelegate.count({ where }),
    ]);

    const items: MaterialPurchaseDto[] = (rows as PurchaseRow[]).map(mapPurchase);

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  async createPurchase(data: CreateMaterialPurchaseInput) {
    return prisma.$transaction(async (tx) => {
      const purchaseData = {
        productId: data.productId,
        supplierId: data.supplierId ?? null,
        invoiceNumber: data.invoiceNumber ?? null,
        quantity: data.quantity,
        remainingQuantity: data.quantity,
        rate: data.rate ?? null,
        purchaseDate: data.purchaseDate,
        remarks: data.remarks ?? null,
      };

      if (this.module === "paint") {
        const product = await tx.paintProduct.findUnique({ where: { id: data.productId } });
        if (!product) throw new Error("Product not found");
        if (!product.isActive) throw new Error("Cannot purchase archived product");

        const purchase = await tx.paintPurchase.create({
          data: purchaseData,
          include: { product: { include: { family: true } }, supplier: true },
        });

        await tx.paintProduct.update({
          where: { id: data.productId },
          data: { remainingStock: { increment: data.quantity } },
        });

        return mapPurchase(purchase as PurchaseRow);
      }

      if (this.module === "hardware") {
        const product = await tx.hardwareProduct.findUnique({ where: { id: data.productId } });
        if (!product) throw new Error("Product not found");
        if (!product.isActive) throw new Error("Cannot purchase archived product");

        const purchase = await tx.hardwarePurchase.create({
          data: purchaseData,
          include: { product: { include: { family: true } }, supplier: true },
        });

        await tx.hardwareProduct.update({
          where: { id: data.productId },
          data: { remainingStock: { increment: data.quantity } },
        });

        return mapPurchase(purchase as PurchaseRow);
      }

      if (this.module === "edgebinding") {
        const product = await tx.edgeBindingProduct.findUnique({ where: { id: data.productId } });
        if (!product) throw new Error("Product not found");
        if (!product.isActive) throw new Error("Cannot purchase archived product");

        const purchase = await tx.edgeBindingPurchase.create({
          data: purchaseData,
          include: { product: { include: { family: true } }, supplier: true },
        });

        await tx.edgeBindingProduct.update({
          where: { id: data.productId },
          data: { remainingStock: { increment: data.quantity } },
        });

        return mapPurchase(purchase as PurchaseRow);
      }

      if (this.module === "glass") {
        const product = await tx.glassProduct.findUnique({ where: { id: data.productId } });
        if (!product) throw new Error("Product not found");
        if (!product.isActive) throw new Error("Cannot purchase archived product");

        const purchase = await tx.glassPurchase.create({
          data: purchaseData,
          include: { product: { include: { family: true } }, supplier: true },
        });

        await tx.glassProduct.update({
          where: { id: data.productId },
          data: { remainingStock: { increment: data.quantity } },
        });

        return mapPurchase(purchase as PurchaseRow);
      }

      const product = await tx.packingProduct.findUnique({ where: { id: data.productId } });
      if (!product) throw new Error("Product not found");
      if (!product.isActive) throw new Error("Cannot purchase archived product");

      const purchase = await tx.packingPurchase.create({
        data: purchaseData,
        include: { product: { include: { family: true } }, supplier: true },
      });

      await tx.packingProduct.update({
        where: { id: data.productId },
        data: { remainingStock: { increment: data.quantity } },
      });

      return mapPurchase(purchase as PurchaseRow);
    });
  }

  async updatePurchase(id: string, data: UpdateMaterialPurchaseInput) {
    return prisma.$transaction(async (tx) => {
      const purchase = await this.findPurchaseInTx(tx, id);
      if (!purchase) throw new Error("Purchase not found");

      const oldQty = toNumber(purchase.quantity);
      const remainingQty = toNumber(purchase.remainingQuantity);
      const consumed = computeConsumed(oldQty, remainingQty);
      const unitLabel = purchase.product.unit;

      const updateData: Record<string, unknown> = {};
      if (data.supplierId !== undefined) updateData.supplierId = data.supplierId ?? null;
      if (data.invoiceNumber !== undefined) updateData.invoiceNumber = data.invoiceNumber ?? null;
      if (data.rate !== undefined) updateData.rate = data.rate ?? null;
      if (data.purchaseDate !== undefined) updateData.purchaseDate = data.purchaseDate;
      if (data.remarks !== undefined) updateData.remarks = data.remarks ?? null;

      if (data.quantity !== undefined) {
        const newQty = roundDecimal(data.quantity);
        assertQuantityEditAllowed(oldQty, remainingQty, newQty, unitLabel);
        const newRemaining = roundDecimal(newQty - consumed);
        const stockDelta = roundDecimal(newQty - oldQty);
        updateData.quantity = newQty;
        updateData.remainingQuantity = newRemaining;

        if (stockDelta !== 0) {
          await this.adjustProductStockInTx(tx, purchase.productId, stockDelta);
        }
      }

      const updated = await this.updatePurchaseInTx(tx, id, updateData);
      return mapPurchase(updated as PurchaseRow);
    });
  }

  async deletePurchase(id: string) {
    return prisma.$transaction(async (tx) => {
      const purchase = await this.findPurchaseInTx(tx, id);
      if (!purchase) throw new Error("Purchase not found");

      const oldQty = toNumber(purchase.quantity);
      const remainingQty = toNumber(purchase.remainingQuantity);
      const consumed = computeConsumed(oldQty, remainingQty);
      assertDeleteAllowed(consumed);

      if (remainingQty > 0) {
        await this.adjustProductStockInTx(tx, purchase.productId, -remainingQty);
      }

      await this.deletePurchaseInTx(tx, id);
    });
  }

  async findPurchaseById(id: string) {
    return this.findPurchaseInTx(prisma, id);
  }

  private async findPurchaseInTx(tx: Prisma.TransactionClient, id: string) {
    const include = { product: { include: { family: true } }, supplier: true };
    if (this.module === "paint") {
      return tx.paintPurchase.findUnique({ where: { id }, include });
    }
    if (this.module === "hardware") {
      return tx.hardwarePurchase.findUnique({ where: { id }, include });
    }
    if (this.module === "edgebinding") {
      return tx.edgeBindingPurchase.findUnique({ where: { id }, include });
    }
    if (this.module === "glass") {
      return tx.glassPurchase.findUnique({ where: { id }, include });
    }
    return tx.packingPurchase.findUnique({ where: { id }, include });
  }

  private async updatePurchaseInTx(tx: Prisma.TransactionClient, id: string, data: Record<string, unknown>) {
    const include = { product: { include: { family: true } }, supplier: true };
    if (this.module === "paint") {
      return tx.paintPurchase.update({ where: { id }, data, include });
    }
    if (this.module === "hardware") {
      return tx.hardwarePurchase.update({ where: { id }, data, include });
    }
    if (this.module === "edgebinding") {
      return tx.edgeBindingPurchase.update({ where: { id }, data, include });
    }
    if (this.module === "glass") {
      return tx.glassPurchase.update({ where: { id }, data, include });
    }
    return tx.packingPurchase.update({ where: { id }, data, include });
  }

  private async deletePurchaseInTx(tx: Prisma.TransactionClient, id: string) {
    if (this.module === "paint") {
      await tx.paintPurchase.delete({ where: { id } });
      return;
    }
    if (this.module === "hardware") {
      await tx.hardwarePurchase.delete({ where: { id } });
      return;
    }
    if (this.module === "edgebinding") {
      await tx.edgeBindingPurchase.delete({ where: { id } });
      return;
    }
    if (this.module === "glass") {
      await tx.glassPurchase.delete({ where: { id } });
      return;
    }
    await tx.packingPurchase.delete({ where: { id } });
  }

  private async adjustProductStockInTx(tx: Prisma.TransactionClient, productId: string, delta: number) {
    const amount = roundDecimal(Math.abs(delta));
    if (amount === 0) return;

    if (this.module === "paint") {
      await tx.paintProduct.update({
        where: { id: productId },
        data: delta > 0 ? { remainingStock: { increment: amount } } : { remainingStock: { decrement: amount } },
      });
      return;
    }
    if (this.module === "hardware") {
      await tx.hardwareProduct.update({
        where: { id: productId },
        data: delta > 0 ? { remainingStock: { increment: amount } } : { remainingStock: { decrement: amount } },
      });
      return;
    }
    if (this.module === "edgebinding") {
      await tx.edgeBindingProduct.update({
        where: { id: productId },
        data: delta > 0 ? { remainingStock: { increment: amount } } : { remainingStock: { decrement: amount } },
      });
      return;
    }
    if (this.module === "glass") {
      await tx.glassProduct.update({
        where: { id: productId },
        data: delta > 0 ? { remainingStock: { increment: amount } } : { remainingStock: { decrement: amount } },
      });
      return;
    }
    await tx.packingProduct.update({
      where: { id: productId },
      data: delta > 0 ? { remainingStock: { increment: amount } } : { remainingStock: { decrement: amount } },
    });
  }

  async findConsumption(query: MaterialListQuery) {
    const productFilter = query.productId ? { productId: query.productId } : {};
    const searchFilter = query.search.trim()
      ? {
          OR: [
            { lot: { lotNumber: { contains: query.search.trim(), mode: "insensitive" as const } } },
            {
              model: { modelName: { contains: query.search.trim(), mode: "insensitive" as const } },
            },
            {
              product: {
                name: { contains: query.search.trim(), mode: "insensitive" as const },
              },
            },
          ],
        }
      : {};

    const where = { ...productFilter, ...searchFilter };
    const skip = (query.page - 1) * query.limit;

    const [rows, total] = await Promise.all([
      this.consumptionDelegate.findMany({
        where,
        include: {
          product: { include: { family: true } },
          lot: true,
          model: true,
        },
        orderBy: { consumedAt: "desc" },
        skip,
        take: query.limit,
      }),
      this.consumptionDelegate.count({ where }),
    ]);

    const items: MaterialConsumptionDto[] = (rows as Array<{
      id: string;
      productId: string;
      product: { name: string; unit: Unit; family?: { name: string } | null };
      lotId: string;
      lot: { lotNumber: string };
      modelId: string;
      model: { modelName: string };
      quantity: unknown;
      remainingAfter: unknown;
      consumedAt: Date;
    }>).map((row) => ({
      id: row.id,
      productId: row.productId,
      productName: materialProductLabel(row.product.family?.name, row.product.name),
      lotId: row.lotId,
      lotNumber: row.lot.lotNumber,
      modelId: row.modelId,
      modelName: row.model.modelName,
      quantity: toNumber(row.quantity),
      unit: row.product.unit,
      remainingAfter: toNumber(row.remainingAfter),
      consumedAt: row.consumedAt.toISOString(),
    }));

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  async findOptions() {
    const rows = await this.productDelegate.findMany({
      where: { isActive: true, remainingStock: { gt: 0 } },
      include: { family: true },
      orderBy: { name: "asc" },
    });

    return (rows as ProductRow[]).map((row) => {
      const display = materialProductLabel(row.family?.name, row.name);
      return {
        id: row.id,
        label: `${display}${row.brand ? ` (${row.brand})` : ""} — ${toNumber(row.remainingStock)} ${row.unit}`,
        remaining: toNumber(row.remainingStock),
        unit: row.unit as Unit,
      };
    });
  }

  /** Active products for catalog model presets (includes zero-stock items). */
  async findCatalogOptions() {
    const rows = await this.productDelegate.findMany({
      where: { isActive: true },
      include: { family: true },
      orderBy: { name: "asc" },
    });

    return (rows as ProductRow[]).map((row) => {
      const display = materialProductLabel(row.family?.name, row.name);
      return {
        id: row.id,
        label: `${display}${row.brand ? ` (${row.brand})` : ""}`,
        remaining: toNumber(row.remainingStock),
        unit: row.unit as Unit,
      };
    });
  }
}

const repositories = {
  paint: new MaterialModuleRepository("paint"),
  hardware: new MaterialModuleRepository("hardware"),
  packing: new MaterialModuleRepository("packing"),
  edgebinding: new MaterialModuleRepository("edgebinding"),
  glass: new MaterialModuleRepository("glass"),
};

export function getMaterialRepository(module: MaterialModuleType) {
  return repositories[module];
}
