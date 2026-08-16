"use client";

import { useEffect, useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DECIMAL_INPUT_STEP } from "@/lib/decimal";
import { positiveNumber } from "@/validators/inventory";

const materialRowSchema = z.object({
  inventoryId: z.string().min(1, "Selection is required"),
  quantity: positiveNumber,
});

const materialMultiFormSchema = z.object({
  rows: z.array(materialRowSchema).min(1, "Add at least one row"),
});

type MaterialMultiFormValues = z.infer<typeof materialMultiFormSchema>;
type MaterialRowValues = z.infer<typeof materialRowSchema>;

export interface MaterialEntryEditValues {
  id: string;
  inventoryId: string;
  quantity: number;
}

export interface MaterialEntryRowInput {
  inventoryId: string;
  quantity: number;
}

export interface MaterialPresetItem {
  productId: string;
  label: string;
  quantity?: number;
}

interface MaterialAddDialogProps {
  title: string;
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options?: Array<{ id: string; label: string }>;
  presetItems?: MaterialPresetItem[];
  editingEntry?: MaterialEntryEditValues | null;
  onSubmit: (entries: MaterialEntryRowInput[]) => Promise<void>;
  isPending?: boolean;
  quantityHeader?: string;
  quantityHint?: string;
}

const emptyRow = (): MaterialRowValues => ({ inventoryId: "", quantity: Number.NaN });

export function MaterialAddDialog({
  title,
  label,
  open,
  onOpenChange,
  options,
  presetItems = [],
  editingEntry,
  onSubmit,
  isPending,
  quantityHeader = "Quantity",
  quantityHint,
}: MaterialAddDialogProps) {
  const isEdit = !!editingEntry;

  const mergedOptions = useMemo(() => {
    const byId = new Map<string, { id: string; label: string }>();
    for (const opt of options ?? []) {
      byId.set(opt.id, opt);
    }
    for (const preset of presetItems) {
      if (!byId.has(preset.productId)) {
        byId.set(preset.productId, {
          id: preset.productId,
          label: `${preset.label} (not in stock)`,
        });
      }
    }
    return Array.from(byId.values());
  }, [options, presetItems]);

  const form = useForm<MaterialMultiFormValues>({
    resolver: zodResolver(materialMultiFormSchema),
    mode: "onSubmit",
    defaultValues: { rows: [emptyRow()] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rows",
  });

  useEffect(() => {
    if (!open) return;
    if (editingEntry) {
      form.reset({
        rows: [
          {
            inventoryId: editingEntry.inventoryId,
            quantity: editingEntry.quantity,
          },
        ],
      });
      return;
    }
    if (presetItems.length > 0) {
      form.reset({
        rows: presetItems.map((preset) => ({
          inventoryId: preset.productId,
          quantity: preset.quantity && preset.quantity > 0 ? preset.quantity : Number.NaN,
        })),
      });
      return;
    }
    form.reset({ rows: [emptyRow()] });
  }, [open, editingEntry, presetItems, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    onOpenChange(false);
    await onSubmit(data.rows);
  });

  if (!open) return null;

  const selectItems = mergedOptions.map((opt) => ({ value: opt.id, label: opt.label }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="overflow-hidden rounded-lg border">
            <div className="grid grid-cols-[1fr_120px_36px] gap-3 border-b bg-muted/40 px-3 py-2.5 text-xs font-medium text-muted-foreground">
              <span>{label}</span>
              <span>{quantityHeader}</span>
              <span />
            </div>

            <div className="max-h-[min(50vh,360px)] overflow-y-auto">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-[1fr_120px_36px] gap-3 border-b px-3 py-3 last:border-b-0"
                >
                  <div className="space-y-1">
                    <Select
                      value={form.watch(`rows.${index}.inventoryId`) || null}
                      onValueChange={(v) => form.setValue(`rows.${index}.inventoryId`, v ?? "")}
                      items={selectItems}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {mergedOptions.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.rows?.[index]?.inventoryId && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.rows[index]?.inventoryId?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Input
                      type="number"
                      step={DECIMAL_INPUT_STEP}
                      min={DECIMAL_INPUT_STEP}
                      placeholder="Qty"
                      {...form.register(`rows.${index}.quantity`, { valueAsNumber: true })}
                    />
                    {form.formState.errors.rows?.[index]?.quantity && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.rows[index]?.quantity?.message}
                      </p>
                    )}
                  </div>

                  {!isEdit && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                      aria-label="Remove row"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {!isEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append(emptyRow())}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add row
            </Button>
          )}

          {quantityHint && (
            <p className="text-xs text-muted-foreground">{quantityHint}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Save" : `Add ${fields.length > 1 ? "entries" : "entry"}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
