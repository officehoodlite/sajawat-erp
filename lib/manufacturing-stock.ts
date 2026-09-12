import type { Prisma } from "@prisma/client";
import { roundDecimal } from "@/lib/decimal";
import { toNumber } from "@/lib/mappers";
import {
  deductMaterialPurchaseLotsFIFO,
  restoreMaterialPurchaseLotsLIFO,
} from "@/lib/purchase-integrity";
import { formatNumber } from "@/utils/format";

export type MaterialType = "paint" | "hardware" | "packing" | "edgebinding" | "glass";

type Tx = Prisma.TransactionClient;

async function getMaterialProduct(tx: Tx, type: MaterialType, productId: string) {
  if (type === "paint") return tx.paintProduct.findUnique({ where: { id: productId } });
  if (type === "hardware") return tx.hardwareProduct.findUnique({ where: { id: productId } });
  if (type === "packing") return tx.packingProduct.findUnique({ where: { id: productId } });
  if (type === "edgebinding") return tx.edgeBindingProduct.findUnique({ where: { id: productId } });
  return tx.glassProduct.findUnique({ where: { id: productId } });
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
    } else if (type === "edgebinding") {
      await tx.edgeBindingProduct.update({
        where: { id: productId },
        data: { remainingStock: { decrement: amount } },
      });
    } else {
      await tx.glassProduct.update({
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
  } else if (type === "edgebinding") {
    await tx.edgeBindingProduct.update({
      where: { id: productId },
      data: { remainingStock: { increment: amount } },
    });
  } else {
    await tx.glassProduct.update({
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

export async function writeMaterialConsumptionLog(
  tx: Tx,
  type: MaterialType,
  data: { productId: string; lotId: string; modelId: string; quantity: number }
) {
  const product = await getMaterialProduct(tx, type, data.productId);
  if (!product) throw new Error("Product not found");

  const logData = {
    productId: data.productId,
    lotId: data.lotId,
    modelId: data.modelId,
    quantity: roundDecimal(data.quantity),
    remainingAfter: roundDecimal(toNumber(product.remainingStock)),
  };

  if (type === "paint") await tx.paintConsumptionLog.create({ data: logData });
  else if (type === "hardware") await tx.hardwareConsumptionLog.create({ data: logData });
  else if (type === "packing") await tx.packingConsumptionLog.create({ data: logData });
  else if (type === "edgebinding") await tx.edgeBindingConsumptionLog.create({ data: logData });
  else await tx.glassConsumptionLog.create({ data: logData });
}

/** Removes the most recent matching consumption log for an entry (model + product + qty). */
export async function removeMaterialConsumptionLog(
  tx: Tx,
  type: MaterialType,
  modelId: string,
  productId: string,
  quantity: number
) {
  const where = {
    modelId,
    productId,
    quantity: roundDecimal(quantity),
  };

  if (type === "paint") {
    const row = await tx.paintConsumptionLog.findFirst({
      where,
      orderBy: { consumedAt: "desc" },
    });
    if (row) await tx.paintConsumptionLog.delete({ where: { id: row.id } });
    return;
  }
  if (type === "hardware") {
    const row = await tx.hardwareConsumptionLog.findFirst({
      where,
      orderBy: { consumedAt: "desc" },
    });
    if (row) await tx.hardwareConsumptionLog.delete({ where: { id: row.id } });
    return;
  }
  if (type === "packing") {
    const row = await tx.packingConsumptionLog.findFirst({
      where,
      orderBy: { consumedAt: "desc" },
    });
    if (row) await tx.packingConsumptionLog.delete({ where: { id: row.id } });
    return;
  }
  if (type === "edgebinding") {
    const row = await tx.edgeBindingConsumptionLog.findFirst({
      where,
      orderBy: { consumedAt: "desc" },
    });
    if (row) await tx.edgeBindingConsumptionLog.delete({ where: { id: row.id } });
    return;
  }
  const row = await tx.glassConsumptionLog.findFirst({
    where,
    orderBy: { consumedAt: "desc" },
  });
  if (row) await tx.glassConsumptionLog.delete({ where: { id: row.id } });
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

/**
 * Rebuild BoardInventory.remainingSqft for a thickness from purchases − admin actual usage.
 * Source of truth for available board stock (carpenter planning entries do not affect stock).
 */
export async function reconcileBoardThicknessRemaining(
  tx: Tx,
  boardThicknessId: string
) {
  const inventories = await tx.boardInventory.findMany({
    where: { boardThicknessId },
    orderBy: [{ purchaseDate: "asc" }, { createdAt: "asc" }],
  });
  if (inventories.length === 0) {
    const usage = await tx.lotActualBoardEntry.aggregate({
      where: { boardThicknessId },
      _sum: { totalSqft: true },
    });
    const used = roundDecimal(toNumber(usage._sum.totalSqft));
    if (used > 0) {
      throw new Error(
        `Insufficient board stock: need ${formatNumber(used)} sqft, have 0 sqft`
      );
    }
    return;
  }

  const usage = await tx.lotActualBoardEntry.aggregate({
    where: { boardThicknessId },
    _sum: { totalSqft: true },
  });
  const netUsed = roundDecimal(toNumber(usage._sum.totalSqft));
  const purchased = roundDecimal(
    inventories.reduce((sum, inv) => sum + toNumber(inv.purchaseSqft), 0)
  );
  const available = roundDecimal(purchased - netUsed);

  if (available < 0) {
    throw new Error(
      `Insufficient board stock: need ${formatNumber(netUsed)} sqft, have ${formatNumber(purchased)} sqft`
    );
  }

  // FIFO consume: oldest purchases are used first; leftover returns sit on newest purchase.
  let consumeLeft = Math.max(0, netUsed);
  const remainders: number[] = inventories.map((inv) => {
    const purchase = roundDecimal(toNumber(inv.purchaseSqft));
    const take = roundDecimal(Math.min(purchase, consumeLeft));
    consumeLeft = roundDecimal(consumeLeft - take);
    return roundDecimal(purchase - take);
  });

  if (netUsed < 0) {
    // Net return/credit: keep full purchase remainders and add credit to newest lot.
    const credit = roundDecimal(Math.abs(netUsed));
    for (let i = 0; i < inventories.length; i++) {
      remainders[i] = roundDecimal(toNumber(inventories[i].purchaseSqft));
    }
    remainders[remainders.length - 1] = roundDecimal(
      remainders[remainders.length - 1] + credit
    );
  }

  for (let i = 0; i < inventories.length; i++) {
    const next = remainders[i];
    const current = roundDecimal(toNumber(inventories[i].remainingSqft));
    if (current === next) continue;
    await tx.boardInventory.update({
      where: { id: inventories[i].id },
      data: { remainingSqft: next },
    });
  }
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
