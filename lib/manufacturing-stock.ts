import type { Prisma } from "@prisma/client";
import { roundDecimal } from "@/lib/decimal";
import { toNumber } from "@/lib/mappers";
import {
  deductMaterialPurchaseLotsFIFO,
  restoreMaterialPurchaseLotsLIFO,
} from "@/lib/purchase-integrity";
import { formatNumber } from "@/utils/format";

export type MaterialType = "paint" | "hardware" | "packing" | "edgebinding";

type Tx = Prisma.TransactionClient;

async function getMaterialProduct(tx: Tx, type: MaterialType, productId: string) {
  if (type === "paint") return tx.paintProduct.findUnique({ where: { id: productId } });
  if (type === "hardware") return tx.hardwareProduct.findUnique({ where: { id: productId } });
  if (type === "packing") return tx.packingProduct.findUnique({ where: { id: productId } });
  return tx.edgeBindingProduct.findUnique({ where: { id: productId } });
}

async function updateMaterialRemaining(
  tx: Tx,
  type: MaterialType,
  productId: string,
  delta: number
) {
  const amount = roundDecimal(Math.abs(delta));
  if (amount === 0) return;

  if (delta < 0) {
    if (type === "paint") {
      await tx.paintProduct.update({
        where: { id: productId },
        data: { remainingStock: { decrement: amount } },
      });
    } else if (type === "hardware") {
      await tx.hardwareProduct.update({
        where: { id: productId },
        data: { remainingStock: { decrement: amount } },
      });
    } else if (type === "packing") {
      await tx.packingProduct.update({
        where: { id: productId },
        data: { remainingStock: { decrement: amount } },
      });
    } else {
      await tx.edgeBindingProduct.update({
        where: { id: productId },
        data: { remainingStock: { decrement: amount } },
      });
    }
    return;
  }

  if (type === "paint") {
    await tx.paintProduct.update({
      where: { id: productId },
      data: { remainingStock: { increment: amount } },
    });
  } else if (type === "hardware") {
    await tx.hardwareProduct.update({
      where: { id: productId },
      data: { remainingStock: { increment: amount } },
    });
  } else if (type === "packing") {
    await tx.packingProduct.update({
      where: { id: productId },
      data: { remainingStock: { increment: amount } },
    });
  } else {
    await tx.edgeBindingProduct.update({
      where: { id: productId },
      data: { remainingStock: { increment: amount } },
    });
  }
}

export async function assertMaterialAvailable(
  tx: Tx,
  type: MaterialType,
  productId: string,
  quantity: number,
  productLabel = "Product"
) {
  const product = await getMaterialProduct(tx, type, productId);
  if (!product || !product.isActive) throw new Error(`${productLabel} not available`);

  const qty = roundDecimal(quantity);
  const remaining = roundDecimal(toNumber(product.remainingStock));
  if (remaining < qty) {
    throw new Error(
      `Insufficient stock for ${product.name}: need ${formatNumber(qty)} ${product.unit}, have ${formatNumber(remaining)} ${product.unit}`
    );
  }
  return product;
}

export async function reserveMaterialStock(
  tx: Tx,
  type: MaterialType,
  productId: string,
  quantity: number,
  productLabel = "Product"
) {
  await assertMaterialAvailable(tx, type, productId, quantity, productLabel);
  const amount = roundDecimal(quantity);
  await updateMaterialRemaining(tx, type, productId, -amount);
  await deductMaterialPurchaseLotsFIFO(tx, type, productId, amount);
}

export async function releaseMaterialStock(
  tx: Tx,
  type: MaterialType,
  productId: string,
  quantity: number
) {
  const amount = roundDecimal(quantity);
  await updateMaterialRemaining(tx, type, productId, amount);
  await restoreMaterialPurchaseLotsLIFO(tx, type, productId, amount);
}

export async function adjustMaterialStock(
  tx: Tx,
  type: MaterialType,
  productId: string,
  previousQty: number,
  nextQty: number
) {
  const oldQty = roundDecimal(previousQty);
  const newQty = roundDecimal(nextQty);

  if (oldQty === newQty) return;

  const product = await getMaterialProduct(tx, type, productId);
  if (!product || !product.isActive) throw new Error("Product not available");

  const remaining = roundDecimal(toNumber(product.remainingStock));
  const maxAllowed = roundDecimal(remaining + oldQty);
  if (newQty > maxAllowed) {
    throw new Error(
      `Insufficient stock for ${product.name}: need ${formatNumber(newQty)} ${product.unit}, available ${formatNumber(maxAllowed)} ${product.unit}`
    );
  }

  const delta = roundDecimal(newQty - oldQty);
  if (delta > 0) {
    await updateMaterialRemaining(tx, type, productId, -delta);
    await deductMaterialPurchaseLotsFIFO(tx, type, productId, delta);
  } else if (delta < 0) {
    await updateMaterialRemaining(tx, type, productId, Math.abs(delta));
    await restoreMaterialPurchaseLotsLIFO(tx, type, productId, Math.abs(delta));
  }
}

export async function assertBoardInventoryAvailable(
  tx: Tx,
  boardInventoryId: string,
  requiredSqft: number,
  extraAvailable = 0
) {
  const inventory = await tx.boardInventory.findUnique({ where: { id: boardInventoryId } });
  if (!inventory) throw new Error("Board inventory not found");

  const required = roundDecimal(requiredSqft);
  const available = roundDecimal(toNumber(inventory.remainingSqft) + extraAvailable);
  if (available < required) {
    throw new Error(
      `Insufficient board stock: need ${formatNumber(required)} sqft, have ${formatNumber(available)} sqft`
    );
  }
  return inventory;
}

export async function reserveBoardInventorySqft(
  tx: Tx,
  boardInventoryId: string,
  sqft: number
) {
  await assertBoardInventoryAvailable(tx, boardInventoryId, sqft);
  await tx.boardInventory.update({
    where: { id: boardInventoryId },
    data: { remainingSqft: { decrement: roundDecimal(sqft) } },
  });
}

export async function releaseBoardInventorySqft(
  tx: Tx,
  boardInventoryId: string,
  sqft: number
) {
  await tx.boardInventory.update({
    where: { id: boardInventoryId },
    data: { remainingSqft: { increment: roundDecimal(sqft) } },
  });
}

export async function adjustBoardInventorySqft(
  tx: Tx,
  boardInventoryId: string,
  previousSqft: number,
  nextSqft: number
) {
  const oldSqft = roundDecimal(previousSqft);
  const newSqft = roundDecimal(nextSqft);
  if (oldSqft === newSqft) return;

  await assertBoardInventoryAvailable(tx, boardInventoryId, newSqft, oldSqft);
  const delta = roundDecimal(newSqft - oldSqft);
  if (delta > 0) {
    await tx.boardInventory.update({
      where: { id: boardInventoryId },
      data: { remainingSqft: { decrement: delta } },
    });
  } else {
    await tx.boardInventory.update({
      where: { id: boardInventoryId },
      data: { remainingSqft: { increment: roundDecimal(Math.abs(delta)) } },
    });
  }
}

export async function reserveBoardThicknessSqft(
  tx: Tx,
  boardThicknessId: string,
  sqft: number
) {
  let remaining = roundDecimal(sqft);
  const inventories = await tx.boardInventory.findMany({
    where: { boardThicknessId, remainingSqft: { gt: 0 } },
    orderBy: { purchaseDate: "asc" },
  });

  const available = roundDecimal(
    inventories.reduce((sum, inv) => sum + toNumber(inv.remainingSqft), 0)
  );
  if (available < remaining) {
    throw new Error(
      `Insufficient board stock: need ${formatNumber(remaining)} sqft, have ${formatNumber(available)} sqft`
    );
  }

  for (const inventory of inventories) {
    if (remaining <= 0) break;
    const invRemaining = roundDecimal(toNumber(inventory.remainingSqft));
    const deduct = roundDecimal(Math.min(remaining, invRemaining));
    if (deduct <= 0) continue;
    await tx.boardInventory.update({
      where: { id: inventory.id },
      data: { remainingSqft: { decrement: deduct } },
    });
    remaining = roundDecimal(remaining - deduct);
  }
}

export async function releaseBoardThicknessSqft(
  tx: Tx,
  boardThicknessId: string,
  sqft: number
) {
  const inventory = await tx.boardInventory.findFirst({
    where: { boardThicknessId },
    orderBy: { purchaseDate: "desc" },
  });
  if (!inventory) throw new Error("Board inventory not found");

  await tx.boardInventory.update({
    where: { id: inventory.id },
    data: { remainingSqft: { increment: roundDecimal(sqft) } },
  });
}

export async function applyBoardThicknessNetDelta(
  tx: Tx,
  boardThicknessId: string,
  delta: number
) {
  const amount = roundDecimal(Math.abs(delta));
  if (amount === 0) return;

  if (delta > 0) {
    await reserveBoardThicknessSqft(tx, boardThicknessId, amount);
  } else {
    await releaseBoardThicknessSqft(tx, boardThicknessId, amount);
  }
}
