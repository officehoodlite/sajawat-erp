"use client";

import { useEffect, useMemo } from "react";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useCatalogProductPicker } from "@/features/catalog/hooks/use-catalog-products";
import { createModelSchema, type CreateModelInput } from "@/validators/manufacturing";
import { useCreateModel } from "@/features/manufacturing/hooks/use-manufacturing";

interface AddModelDialogProps {
  lotId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
}

export function AddModelDialog({ lotId, open, onOpenChange, disabled }: AddModelDialogProps) {
  const { data: products = [] } = useCatalogProductPicker(open);
  const createModel = useCreateModel(lotId);

  const form = useForm<CreateModelInput>({
    resolver: zodResolver(createModelSchema),
    mode: "onSubmit",
    defaultValues: {
      productId: "",
      catalogModelId: "",
      quantity: 1,
    },
  });

  const productId = form.watch("productId");
  const catalogModelId = form.watch("catalogModelId");

  const catalogModels = useMemo(
    () => products.find((p) => p.id === productId)?.models ?? [],
    [products, productId]
  );

  useEffect(() => {
    if (open) form.reset({ productId: "", catalogModelId: "", quantity: 1 });
  }, [open, form]);

  useEffect(() => {
    form.setValue("catalogModelId", "");
  }, [productId, form]);

  const onSubmit = form.handleSubmit(async (data) => {
    onOpenChange(false);
    await createModel.mutateAsync(data);
    form.reset();
  });

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-visible rounded-xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Model</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label required>Product Type</Label>
            <SearchableSelect
              value={productId || null}
              onValueChange={(v) => form.setValue("productId", v, { shouldValidate: true })}
              items={products.map((p) => ({ value: p.id, label: p.name }))}
              placeholder="Select product type"
              searchPlaceholder="Search products..."
            />
            {form.formState.errors.productId && (
              <p className="text-sm text-destructive">{form.formState.errors.productId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label required>Model</Label>
            <SearchableSelect
              value={catalogModelId || null}
              onValueChange={(v) => form.setValue("catalogModelId", v, { shouldValidate: true })}
              items={catalogModels.map((m) => ({
                value: m.id,
                label: m.modelName,
              }))}
              disabled={!productId}
              placeholder={productId ? "Select model" : "Select product first"}
              searchPlaceholder="Search models..."
            />
            {form.formState.errors.catalogModelId && (
              <p className="text-sm text-destructive">
                {form.formState.errors.catalogModelId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity" required>
              Quantity
            </Label>
            <Input
              id="quantity"
              type="number"
              {...form.register("quantity", { valueAsNumber: true })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createModel.isPending || disabled}>
              {createModel.isPending ? "Adding..." : "Add Model"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
