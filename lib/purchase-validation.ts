import {
  assertDeleteAllowed,
  assertQuantityEditAllowed,
  computeConsumed,
  deletePurchaseError,
  quantityEditError,
} from "@/lib/purchase-integrity";

export {
  computeConsumed,
  quantityEditError,
  deletePurchaseError,
  assertQuantityEditAllowed,
  assertDeleteAllowed,
};

export function validateQuantityEdit(
  purchaseQty: number,
  remainingQty: number,
  newQty: number,
  unitLabel: string
): string | null {
  const consumed = computeConsumed(purchaseQty, remainingQty);
  if (newQty < consumed) {
    return quantityEditError(consumed, unitLabel);
  }
  return null;
}

export function validateDelete(consumed: number): string | null {
  if (consumed > 0) {
    return deletePurchaseError();
  }
  return null;
}
