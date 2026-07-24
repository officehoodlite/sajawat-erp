"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SupplierSelect } from "@/features/inventory/components/shared/supplier-select";
import { validateQuantityEdit } from "@/lib/purchase-validation";
import type { BoardPurchaseDto } from "@/types/dto";
import { coercedPositiveNumber, updateBoardInventorySchema } from "@/validators/inventory";
import { formatNumber } from "@/utils/format";

const editBoardPurchaseFormSchema = updateBoardInventorySchema.extend({
  purchaseSqft: coercedPositiveNumber.optional(),
});

type EditBoardPurchaseFormValues = z.infer<typeof editBoardPurchaseFormSchema>;

interface EditBoardPurchaseDialogProps {
  purchase: BoardPurchaseDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EditBoardPurchaseFormValues) => Promise<void>;
  isPending?: boolean;
}

export function EditBoardPurchaseDialog({
  purchase,
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: EditBoardPurchaseDialogProps) {
  const form = useForm({
    resolver: zodResolver(editBoardPurchaseFormSchema),
    mode: "onSubmit",
    defaultValues: {
      supplierId: undefined,
      purchaseSqft: 1,
      purchaseDate: new Date(),
      rate: undefined,
    },
  });

  useEffect(() => {
    if (open && purchase) {
      form.reset({
        supplierId: purchase.supplierId ?? undefined,
        purchaseSqft: purchase.quantity,
        purchaseDate: new Date(purchase.purchaseDate),
        rate: purchase.rate ?? undefined,
      });
    }
  }, [open, purchase, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!purchase) return;

    if (data.purchaseSqft !== undefined) {
      const error = validateQuantityEdit(
        purchase.quantity,
        purchase.remainingQuantity,
        data.purchaseSqft,
        "SqFt"
      );
      if (error) {
        form.setError("purchaseSqft", { message: error });
        return;
      }
    }

    onOpenChange(false);
    await onSubmit(data);
  });

  if (!open || !purchase) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Purchase</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Product</Label>
            <Input value={`${purchase.materialName} ${purchase.thickness}`} disabled />
          </div>
          {purchase.consumedQuantity > 0 && (
            <p className="text-sm text-muted-foreground">
              Consumed: {formatNumber(purchase.consumedQuantity)} SqFt
            </p>
          )}
          <SupplierSelect
            value={form.watch("supplierId") as string | undefined}
            onChange={(v) => form.setValue("supplierId", v)}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label required>Quantity (SqFt)</Label>
              <Input type="number" step="any" {...form.register("purchaseSqft", { valueAsNumber: true })} />
              {form.formState.errors.purchaseSqft && (
                <p className="text-sm text-destructive">{form.formState.errors.purchaseSqft.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Rate (optional)</Label>
              <Input
                type="number"
                step="any"
                {...form.register("rate", {
                  setValueAs: (v) =>
                    v === "" || v === null || v === undefined ? undefined : Number(v),
                })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label required>Purchase Date</Label>
            <Input
              type="date"
              defaultValue={new Date(purchase.purchaseDate).toISOString().slice(0, 10)}
              onChange={(e) => form.setValue("purchaseDate", new Date(e.target.value))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
