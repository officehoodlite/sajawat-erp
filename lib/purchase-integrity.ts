import type { Prisma } from "@prisma/client";
import { roundDecimal } from "@/lib/decimal";
import { toNumber } from "@/lib/mappers";
import { formatNumber } from "@/utils/format";

type Tx = Prisma.TransactionClient;
type MaterialType = "paint" | "hardware" | "packing" | "edgebinding";

export function computeConsumed(purchaseQty: number, remainingQty: number): number {
  return roundDecimal(Math.max(0, purchaseQty - remainingQty));
}

export function quantityEditError(consumed: number, unitLabel: string): string {
  return `Cannot reduce purchase quantity below the quantity already consumed (${formatNumber(consumed)} ${unitLabel}).`;
}

export function deletePurchaseError(): string {
  return "Cannot delete this purchase because some stock from this purchase has already been consumed.";
}

export function assertQuantityEditAllowed(
  purchaseQty: number,
  remainingQty: number,
  newQty: number,
  unitLabel: string
): void {
  const consumed = computeConsumed(purchaseQty, remainingQty);
  if (roundDecimal(newQty) < consumed) {
    throw new Error(quantityEditError(consumed, unitLabel));
  }
}

export function assertDeleteAllowed(consumed: number): void {
  if (consumed > 0) {
    throw new Error(deletePurchaseError());
  }
}

async function findMaterialPurchasesWithRemaining(tx: Tx, type: MaterialType, productId: string) {
  const where = { productId, remainingQuantity: { gt: 0 } as const };
  const orderBy = { purchaseDate: "asc" as const };

  if (type === "paint") {
    return tx.paintPurchase.findMany({ where, orderBy });
  }
  if (type === "hardware") {
    return tx.hardwarePurchase.findMany({ where, orderBy });
  }
  if (type === "packing") {
    return tx.packingPurchase.findMany({ where, orderBy });
  }
  return tx.edgeBindingPurchase.findMany({ where, orderBy });
}

async function findMaterialPurchasesForRestore(tx: Tx, type: MaterialType, productId: string) {
  const orderBy = { purchaseDate: "desc" as const };

  if (type === "paint") {
    return tx.paintPurchase.findMany({
      where: { productId },
      orderBy,
    });
  }
  if (type === "hardware") {
    return tx.hardwarePurchase.findMany({
      where: { productId },
      orderBy,
    });
  }
  if (type === "packing") {
    return tx.packingPurchase.findMany({
      where: { productId },
      orderBy,
    });
  }
  return tx.edgeBindingPurchase.findMany({
    where: { productId },
    orderBy,
  });
}

async function updateMaterialPurchaseRemaining(
  tx: Tx,
  type: MaterialType,
  purchaseId: string,
  delta: number
) {
  const amount = roundDecimal(Math.abs(delta));
  if (amount === 0) return;

  if (delta < 0) {
    if (type === "paint") {
      await tx.paintPurchase.update({
        where: { id: purchaseId },
        data: { remainingQuantity: { decrement: amount } },
      });
    } else if (type === "hardware") {
      await tx.hardwarePurchase.update({
        where: { id: purchaseId },
        data: { remainingQuantity: { decrement: amount } },
      });
    } else if (type === "packing") {
      await tx.packingPurchase.update({
        where: { id: purchaseId },
        data: { remainingQuantity: { decrement: amount } },
      });
    } else {
      await tx.edgeBindingPurchase.update({
        where: { id: purchaseId },
        data: { remainingQuantity: { decrement: amount } },
      });
    }
    return;
  }

  if (type === "paint") {
    await tx.paintPurchase.update({
      where: { id: purchaseId },
      data: { remainingQuantity: { increment: amount } },
    });
  } else if (type === "hardware") {
    await tx.hardwarePurchase.update({
      where: { id: purchaseId },
      data: { remainingQuantity: { increment: amount } },
    });
  } else if (type === "packing") {
    await tx.packingPurchase.update({
      where: { id: purchaseId },
      data: { remainingQuantity: { increment: amount } },
    });
  } else {
    await tx.edgeBindingPurchase.update({
      where: { id: purchaseId },
      data: { remainingQuantity: { increment: amount } },
    });
  }
}

export async function deductMaterialPurchaseLotsFIFO(
  tx: Tx,
  type: MaterialType,
  productId: string,
  amount: number
) {
  let remaining = roundDecimal(amount);
  if (remaining <= 0) return;

  const purchases = await findMaterialPurchasesWithRemaining(tx, type, productId);

  for (const purchase of purchases) {
    if (remaining <= 0) break;
    const lotRemaining = roundDecimal(toNumber(purchase.remainingQuantity));
    const deduct = roundDecimal(Math.min(remaining, lotRemaining));
    if (deduct <= 0) continue;
    await updateMaterialPurchaseRemaining(tx, type, purchase.id, -deduct);
    remaining = roundDecimal(remaining - deduct);
  }

  if (remaining > 0) {
    throw new Error("Insufficient purchase lot stock for FIFO deduction");
  }
}

export async function restoreMaterialPurchaseLotsLIFO(
  tx: Tx,
  type: MaterialType,
  productId: string,
  amount: number
) {
  let remaining = roundDecimal(amount);
  if (remaining <= 0) return;

  const purchases = await findMaterialPurchasesForRestore(tx, type, productId);

  for (const purchase of purchases) {
    if (remaining <= 0) break;
    const lotQty = roundDecimal(toNumber(purchase.quantity));
    const lotRemaining = roundDecimal(toNumber(purchase.remainingQuantity));
    const restorable = roundDecimal(lotQty - lotRemaining);
    const restore = roundDecimal(Math.min(remaining, restorable));
    if (restore <= 0) continue;
    await updateMaterialPurchaseRemaining(tx, type, purchase.id, restore);
    remaining = roundDecimal(remaining - restore);
  }

  if (remaining > 0) {
    const newest = purchases[purchases.length - 1];
    if (newest) {
      await updateMaterialPurchaseRemaining(tx, type, newest.id, remaining);
    }
  }
}
