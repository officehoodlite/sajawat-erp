"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SupplierSelect } from "@/features/inventory/components/shared/supplier-select";
import { validateQuantityEdit } from "@/lib/purchase-validation";
import type { MaterialModuleType } from "@/types/enums";
import type { MaterialPurchaseDto } from "@/types/material-module";
import {
  updateMaterialPurchaseSchema,
  type UpdateMaterialPurchaseInput,
} from "@/validators/inventory";
import { formatNumber } from "@/utils/format";

type EditPurchaseFormValues = UpdateMaterialPurchaseInput;

interface EditPurchaseDialogProps {
  type: MaterialModuleType;
  purchase: MaterialPurchaseDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EditPurchaseFormValues) => Promise<void>;
  isPending?: boolean;
}

export function EditPurchaseDialog({
  type,
  purchase,
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: EditPurchaseDialogProps) {
  const form = useForm({
    resolver: zodResolver(updateMaterialPurchaseSchema),
    mode: "onSubmit",
    defaultValues: {
      supplierId: undefined,
      invoiceNumber: "",
      quantity: 1,
      rate: undefined,
      purchaseDate: new Date(),
      remarks: "",
    },
  });

  useEffect(() => {
    if (open && purchase) {
      form.reset({
        supplierId: purchase.supplierId ?? undefined,
        invoiceNumber: purchase.invoiceNumber ?? "",
        quantity: purchase.quantity,
        rate: purchase.rate ?? undefined,
        purchaseDate: new Date(purchase.purchaseDate),
        remarks: purchase.remarks ?? "",
      });
    }
  }, [open, purchase, form]);

  const label = type.charAt(0).toUpperCase() + type.slice(1);

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!purchase) return;

    if (data.quantity !== undefined) {
      const error = validateQuantityEdit(
        purchase.quantity,
        purchase.remainingQuantity,
        data.quantity,
        purchase.unit
      );
      if (error) {
        form.setError("quantity", { message: error });
        return;
      }
    }

    onOpenChange(false);
    await onSubmit({
      ...data,
      invoiceNumber: type === "paint" ? undefined : data.invoiceNumber || undefined,
      remarks: data.remarks || undefined,
    });
  });

  if (!open || !purchase) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit {label} Purchase</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Product</Label>
            <Input value={purchase.productName} disabled />
          </div>
          {purchase.consumedQuantity > 0 && (
            <p className="text-sm text-muted-foreground">
              Consumed: {formatNumber(purchase.consumedQuantity)} {purchase.unit}
            </p>
          )}
          <SupplierSelect
            value={form.watch("supplierId") as string | undefined}
            onChange={(v) => form.setValue("supplierId", v)}
          />
          {type !== "paint" && (
            <div className="space-y-2">
              <Label>Invoice # (optional)</Label>
              <Input {...form.register("invoiceNumber")} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label required>Quantity</Label>
              <Input type="number" step="any" {...form.register("quantity", { valueAsNumber: true })} />
              {form.formState.errors.quantity && (
                <p className="text-sm text-destructive">{form.formState.errors.quantity.message}</p>
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
          <div className="space-y-2">
            <Label>Remarks (optional)</Label>
            <Textarea {...form.register("remarks")} rows={2} />
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
