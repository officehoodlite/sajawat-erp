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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SupplierSelect } from "@/features/inventory/components/shared/supplier-select";
import {
  createBoardInventorySchema,
  type CreateBoardInventoryInput,
} from "@/validators/inventory";

interface AddBoardPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  thicknessOptions: Array<{ id: string; label: string }>;
  onSubmit: (data: CreateBoardInventoryInput) => Promise<void>;
  isPending?: boolean;
}

export function AddBoardPurchaseDialog({
  open,
  onOpenChange,
  thicknessOptions,
  onSubmit,
  isPending,
}: AddBoardPurchaseDialogProps) {
  const form = useForm({
    resolver: zodResolver(createBoardInventorySchema),
    mode: "onSubmit",
    defaultValues: {
      boardThicknessId: "",
      purchaseSqft: 1,
      purchaseDate: new Date(),
      supplierId: undefined,
      rate: undefined,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        boardThicknessId: "",
        purchaseSqft: 1,
        purchaseDate: new Date(),
        supplierId: undefined,
        rate: undefined,
      });
    }
  }, [open, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    onOpenChange(false);
    await onSubmit(data);
  });

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Purchase</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label required>Board + Thickness</Label>
            <Select
              value={form.watch("boardThicknessId") || null}
              onValueChange={(v) => form.setValue("boardThicknessId", v ?? "")}
              items={thicknessOptions.map((opt) => ({ value: opt.id, label: opt.label }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select board and thickness" />
              </SelectTrigger>
              <SelectContent>
                {thicknessOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.boardThicknessId && (
              <p className="text-sm text-destructive">
                {form.formState.errors.boardThicknessId.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label required>Quantity (SqFt)</Label>
            <Input type="number" step="any" {...form.register("purchaseSqft", { valueAsNumber: true })} />
          </div>
          <SupplierSelect
            value={form.watch("supplierId") as string | undefined}
            onChange={(v) => form.setValue("supplierId", v)}
          />
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
          <div className="space-y-2">
            <Label required>Purchase Date</Label>
            <Input
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              onChange={(e) => form.setValue("purchaseDate", new Date(e.target.value))}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
