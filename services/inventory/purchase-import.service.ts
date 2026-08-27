import { prisma } from "@/lib/prisma";
import { parseFirstSheetRows } from "@/lib/xlsx-rows";
import { inventoryService } from "@/services/inventory/inventory.service";
import { getMaterialModuleService } from "@/services/inventory/material-module.service";
import type { MaterialModuleType } from "@/types/enums";

const MAX_ROWS = 500;

export type PurchaseImportResult = {
  created: number;
  updated: number;
  errors: Array<{ row: number; message: string }>;
};

function excelRowNumber(index: number) {
  return index + 2;
}

function parseDate(value: string, row: number) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) throw new Error(`Row ${row}: purchaseDate must be YYYY-MM-DD`);
  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error(`Row ${row}: invalid purchaseDate`);
  return date;
}

function parsePositiveNumber(value: string, field: string, row: number) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Row ${row}: ${field} must be greater than 0`);
  }
  return n;
}

function parseOptionalPositive(value: string | undefined, field: string, row: number) {
  if (!value?.trim()) return undefined;
  return parsePositiveNumber(value, field, row);
}

async function resolveSupplierId(name: string | undefined, row: number) {
  if (!name?.trim()) return undefined;
  const matches = await prisma.supplier.findMany({
    where: { name: { equals: name.trim(), mode: "insensitive" } },
    select: { id: true },
  });
  if (matches.length === 0) throw new Error(`Row ${row}: unknown supplier "${name.trim()}"`);
  if (matches.length > 1) throw new Error(`Row ${row}: supplier "${name.trim()}" is ambiguous`);
  return matches[0].id;
}

async function resolveBoardThicknessId(material: string, thickness: string, row: number) {
  const matches = await prisma.boardThickness.findMany({
    where: {
      thickness: { equals: thickness.trim(), mode: "insensitive" },
      board: { materialName: { equals: material.trim(), mode: "insensitive" } },
    },
    select: { id: true },
  });
  if (matches.length === 0) {
    throw new Error(`Row ${row}: unknown board material/thickness "${material}" / "${thickness}"`);
  }
  if (matches.length > 1) {
    throw new Error(`Row ${row}: board material/thickness "${material}" / "${thickness}" is ambiguous`);
  }
  return matches[0].id;
}

async function resolveMaterialProductId(module: MaterialModuleType, name: string, row: number) {
  const where = { name: { equals: name.trim(), mode: "insensitive" as const } };
  const matches =
    module === "paint"
      ? await prisma.paintProduct.findMany({ where, select: { id: true } })
      : module === "hardware"
        ? await prisma.hardwareProduct.findMany({ where, select: { id: true } })
        : module === "edgebinding"
          ? await prisma.edgeBindingProduct.findMany({ where, select: { id: true } })
          : module === "glass"
            ? await prisma.glassProduct.findMany({ where, select: { id: true } })
            : await prisma.packingProduct.findMany({ where, select: { id: true } });
  if (matches.length === 0) throw new Error(`Row ${row}: unknown product "${name.trim()}"`);
  if (matches.length > 1) throw new Error(`Row ${row}: product "${name.trim()}" is ambiguous`);
  return matches[0].id;
}

export async function importBoardPurchases(buffer: Buffer): Promise<PurchaseImportResult> {
  const rows = await parseFirstSheetRows(buffer);
  if (rows.length > MAX_ROWS) {
    throw new Error(`Too many rows (max ${MAX_ROWS})`);
  }

  const result: PurchaseImportResult = { created: 0, updated: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const n = excelRowNumber(i);
    try {
      const id = row.id?.trim();
      if (!row.material?.trim() || !row.thickness?.trim() || !row.purchasesqft?.trim() || !row.purchasedate?.trim()) {
        throw new Error(`Row ${n}: material, thickness, purchaseSqft, and purchaseDate are required`);
      }
      const boardThicknessId = await resolveBoardThicknessId(row.material, row.thickness, n);
      const supplierId = await resolveSupplierId(row.supplier, n);
      const purchaseSqft = parsePositiveNumber(row.purchasesqft, "purchaseSqft", n);
      const purchaseDate = parseDate(row.purchasedate, n);
      const rate = parseOptionalPositive(row.rate, "rate", n);

      const existing = id ? await inventoryService.getBoardInventory(id) : null;
      if (id && existing) {
        await inventoryService.updateBoardInventory(id, {
          purchaseSqft,
          purchaseDate,
          supplierId,
          rate,
        });
        result.updated += 1;
      } else {
        await inventoryService.createBoardInventory({
          boardThicknessId,
          purchaseSqft,
          purchaseDate,
          supplierId,
          rate,
        });
        result.created += 1;
      }
    } catch (error) {
      result.errors.push({
        row: n,
        message: error instanceof Error ? error.message.replace(/^Row \d+:\s*/, "") : "Import failed",
      });
    }
  }

  return result;
}

export async function importMaterialPurchases(
  module: MaterialModuleType,
  buffer: Buffer
): Promise<PurchaseImportResult> {
  const rows = await parseFirstSheetRows(buffer);
  if (rows.length > MAX_ROWS) {
    throw new Error(`Too many rows (max ${MAX_ROWS})`);
  }

  const service = getMaterialModuleService(module);
  const result: PurchaseImportResult = { created: 0, updated: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const n = excelRowNumber(i);
    try {
      const id = row.id?.trim();
      if (!row.product?.trim() || !row.quantity?.trim() || !row.purchasedate?.trim()) {
        throw new Error(`Row ${n}: product, quantity, and purchaseDate are required`);
      }
      const productId = await resolveMaterialProductId(module, row.product, n);
      const supplierId = await resolveSupplierId(row.supplier, n);
      const quantity = parsePositiveNumber(row.quantity, "quantity", n);
      const purchaseDate = parseDate(row.purchasedate, n);
      const rate = parseOptionalPositive(row.rate, "rate", n);
      const invoiceNumber = module === "packing" ? row.invoice?.trim() || undefined : undefined;
      const remarks = row.remarks?.trim() || undefined;

      const existing = id ? await service.getPurchase(id) : null;
      if (id && existing) {
        await service.updatePurchase(id, {
          quantity,
          purchaseDate,
          supplierId,
          rate,
          invoiceNumber,
          remarks,
        });
        result.updated += 1;
      } else {
        await service.createPurchase({
          productId,
          quantity,
          purchaseDate,
          supplierId,
          rate,
          invoiceNumber,
          remarks,
        });
        result.created += 1;
      }
    } catch (error) {
      result.errors.push({
        row: n,
        message: error instanceof Error ? error.message.replace(/^Row \d+:\s*/, "") : "Import failed",
      });
    }
  }

  return result;
}
