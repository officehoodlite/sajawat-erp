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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SupplierSelect } from "@/features/inventory/components/shared/supplier-select";
import type { MaterialModuleType } from "@/types/enums";
import { MATERIAL_MODULE_LABELS } from "@/types/enums";
import {
  createMaterialPurchaseSchema,
  type CreateMaterialPurchaseInput,
} from "@/validators/inventory";
import type { MaterialProductDto } from "@/types/material-module";

interface AddPurchaseDialogProps {
  type: MaterialModuleType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: MaterialProductDto[];
  defaultProductId?: string;
  onSubmit: (data: CreateMaterialPurchaseInput) => Promise<void>;
  isPending?: boolean;
}

export function AddPurchaseDialog({
  type,
  open,
  onOpenChange,
  products,
  defaultProductId,
  onSubmit,
  isPending,
}: AddPurchaseDialogProps) {
  const form = useForm({
    resolver: zodResolver(createMaterialPurchaseSchema),
    mode: "onSubmit",
    defaultValues: {
      productId: "",
      supplierId: undefined,
      invoiceNumber: "",
      quantity: 1,
      rate: undefined,
      purchaseDate: new Date(),
      remarks: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        productId: defaultProductId ?? "",
        supplierId: undefined,
        invoiceNumber: "",
        quantity: 1,
        rate: undefined,
        purchaseDate: new Date(),
        remarks: "",
      });
    }
  }, [open, defaultProductId, form]);

  const label = MATERIAL_MODULE_LABELS[type];

  const handleSubmit = form.handleSubmit(async (data) => {
    onOpenChange(false);
    await onSubmit({
      productId: data.productId,
      supplierId: data.supplierId,
      invoiceNumber: type === "packing" ? data.invoiceNumber || undefined : undefined,
      quantity: data.quantity,
      rate: data.rate,
      purchaseDate: data.purchaseDate,
      remarks: data.remarks || undefined,
    });
  });

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add {label} Purchase</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label required>Product</Label>
            <Select
              value={form.watch("productId") || null}
              onValueChange={(v) => form.setValue("productId", v ?? "")}
              items={products.map((p) => ({ value: p.id, label: p.name }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.productId && (
              <p className="text-sm text-destructive">{form.formState.errors.productId.message}</p>
            )}
          </div>
          <SupplierSelect
            value={form.watch("supplierId") as string | undefined}
            onChange={(v) => form.setValue("supplierId", v)}
          />
          {type === "packing" && (
            <div className="space-y-2">
              <Label>Invoice # (optional)</Label>
              <Input {...form.register("invoiceNumber")} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label required>Quantity</Label>
              <Input type="number" step="any" {...form.register("quantity", { valueAsNumber: true })} />
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
              defaultValue={new Date().toISOString().slice(0, 10)}
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
              {isPending ? "Saving..." : "Add Purchase"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
