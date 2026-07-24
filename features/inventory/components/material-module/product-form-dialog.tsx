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
import { UNITS, UNIT_LABELS, type MaterialModuleType } from "@/types/enums";
import {
  createMaterialProductSchema,
  type CreateMaterialProductInput,
} from "@/validators/inventory";
import type { MaterialProductDto } from "@/types/material-module";

interface ProductFormDialogProps {
  type: MaterialModuleType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: MaterialProductDto | null;
  onSubmit: (data: CreateMaterialProductInput) => Promise<void>;
  isPending?: boolean;
}

export function ProductFormDialog({
  type,
  open,
  onOpenChange,
  product,
  onSubmit,
  isPending,
}: ProductFormDialogProps) {
  const form = useForm({
    resolver: zodResolver(createMaterialProductSchema),
    mode: "onSubmit",
    defaultValues: {
      name: "",
      unit: "PCS" as const,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: product?.name ?? "",
        unit: product?.unit ?? "PCS",
      });
    }
  }, [open, product, form]);

  const label = type.charAt(0).toUpperCase() + type.slice(1);

  const handleSubmit = form.handleSubmit(async (data) => {
    onOpenChange(false);
    await onSubmit({
      name: data.name,
      unit: data.unit,
    });
  });

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product ? `Edit ${label} Product` : `Add ${label} Product`}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label required>Name</Label>
            <Input {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label required>Unit</Label>
            <Select
              value={form.watch("unit")}
              onValueChange={(v) => form.setValue("unit", v as CreateMaterialProductInput["unit"])}
              items={UNITS.map((u) => ({ value: u, label: UNIT_LABELS[u] }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {UNIT_LABELS[u]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : product ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
