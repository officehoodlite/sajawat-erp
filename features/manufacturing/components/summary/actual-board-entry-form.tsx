"use client";

import { useEffect, useMemo } from "react";
import { useFieldArray, useForm, useWatch, type Control } from "react-hook-form";
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
import {
  createLotActualBoardEntrySchema,
  type CreateLotActualBoardEntryInput,
} from "@/validators/manufacturing";
import { DECIMAL_INPUT_STEP } from "@/lib/decimal";
import { useThicknessOptions } from "@/features/inventory/hooks/use-inventory";
import { calcActualBoardTotalSqft } from "@/utils/board-calculations";
import { formatSqft } from "@/utils/format";
import type { LotActualBoardEntryDto } from "@/types/dto";

const actualBoardMultiFormSchema = z.object({
  rows: z.array(createLotActualBoardEntrySchema).min(1, "Add at least one row"),
});

type ActualBoardMultiFormValues = z.infer<typeof actualBoardMultiFormSchema>;

interface ActualBoardEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (entries: CreateLotActualBoardEntryInput[]) => Promise<void>;
  isPending?: boolean;
  entry?: LotActualBoardEntryDto | null;
}

const emptyRow = (): CreateLotActualBoardEntryInput => ({
  boardThicknessId: "",
  length: 0,
  width: 0,
  quantity: 0,
  sqftIn: 0,
  sqftOut: 0,
});

function ActualBoardRowTotalSqft({
  control,
  index,
}: {
  control: Control<ActualBoardMultiFormValues>;
  index: number;
}) {
  const length = useWatch({ control, name: `rows.${index}.length` });
  const width = useWatch({ control, name: `rows.${index}.width` });
  const quantity = useWatch({ control, name: `rows.${index}.quantity` });
  const sqftIn = useWatch({ control, name: `rows.${index}.sqftIn` });
  const sqftOut = useWatch({ control, name: `rows.${index}.sqftOut` });

  const totalSqft = useMemo(() => {
    const l = Number(length) || 0;
    const w = Number(width) || 0;
    const q = Number(quantity) || 0;
    const inVal = Number(sqftIn) || 0;
    const outVal = Number(sqftOut) || 0;
    const hasDimensions = l > 0 && w > 0 && q > 0;
    if (!hasDimensions && inVal === 0 && outVal === 0) return null;
    return calcActualBoardTotalSqft(l, w, q, inVal, outVal);
  }, [length, width, quantity, sqftIn, sqftOut]);

  return (
    <div className="flex h-9 items-center justify-end px-1">
      <span className="text-sm font-medium text-primary">
        {totalSqft != null ? formatSqft(totalSqft) : "—"}
      </span>
    </div>
  );
}

export function ActualBoardEntryForm({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  entry,
}: ActualBoardEntryFormProps) {
  const { data: thicknessOptions } = useThicknessOptions(open);
  const isEdit = !!entry;

  const form = useForm<ActualBoardMultiFormValues>({
    resolver: zodResolver(actualBoardMultiFormSchema),
    mode: "onSubmit",
    defaultValues: { rows: [emptyRow()] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rows",
  });

  useEffect(() => {
    if (!open) return;
    if (entry) {
      form.reset({
        rows: [
          {
            boardThicknessId: entry.boardThicknessId,
            length: entry.length,
            width: entry.width,
            quantity: entry.quantity,
            sqftIn: entry.sqftIn,
            sqftOut: entry.sqftOut,
          },
        ],
      });
      return;
    }
    form.reset({ rows: [emptyRow()] });
  }, [open, entry, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    onOpenChange(false);
    await onSubmit(data.rows);
  });

  if (!open) return null;

  const selectItems =
    thicknessOptions?.map((opt) => ({ value: opt.id, label: opt.label })) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl sm:max-w-7xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Actual Board Entry" : "Add Actual Board Entries"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="overflow-hidden rounded-lg border">
            <div className="grid grid-cols-[minmax(140px,1.3fr)_72px_72px_56px_72px_72px_96px_36px] gap-2 border-b bg-muted/40 px-3 py-2.5 text-xs font-medium text-muted-foreground">
              <span>Board</span>
              <span>Length (sqft)</span>
              <span>Width (sqft)</span>
              <span>Qty</span>
              <span>In (sqft)</span>
              <span>Out (sqft)</span>
              <span className="text-right">Net SqFt</span>
              <span />
            </div>

            <div className="max-h-[min(50vh,400px)] overflow-y-auto">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-[minmax(140px,1.3fr)_72px_72px_56px_72px_72px_96px_36px] gap-2 border-b px-3 py-3 last:border-b-0"
                >
                  <div className="space-y-1">
                    <Select
                      value={form.watch(`rows.${index}.boardThicknessId`) || null}
                      onValueChange={(v) =>
                        form.setValue(`rows.${index}.boardThicknessId`, v ?? "")
                      }
                      items={selectItems}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select board" />
                      </SelectTrigger>
                      <SelectContent>
                        {thicknessOptions?.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.rows?.[index]?.boardThicknessId && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.rows[index]?.boardThicknessId?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Input
                      type="number"
                      step={DECIMAL_INPUT_STEP}
                      min={0}
                      {...form.register(`rows.${index}.length`, { valueAsNumber: true })}
                    />
                    {form.formState.errors.rows?.[index]?.length && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.rows[index]?.length?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Input
                      type="number"
                      step={DECIMAL_INPUT_STEP}
                      min={0}
                      {...form.register(`rows.${index}.width`, { valueAsNumber: true })}
                    />
                    {form.formState.errors.rows?.[index]?.width && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.rows[index]?.width?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Input
                      type="number"
                      min={0}
                      {...form.register(`rows.${index}.quantity`, { valueAsNumber: true })}
                    />
                    {form.formState.errors.rows?.[index]?.quantity && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.rows[index]?.quantity?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Input
                      type="number"
                      step={DECIMAL_INPUT_STEP}
                      min={0}
                      {...form.register(`rows.${index}.sqftIn`, { valueAsNumber: true })}
                    />
                    {form.formState.errors.rows?.[index]?.sqftIn && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.rows[index]?.sqftIn?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Input
                      type="number"
                      step={DECIMAL_INPUT_STEP}
                      min={0}
                      {...form.register(`rows.${index}.sqftOut`, { valueAsNumber: true })}
                    />
                    {form.formState.errors.rows?.[index]?.sqftOut && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.rows[index]?.sqftOut?.message}
                      </p>
                    )}
                  </div>

                  <ActualBoardRowTotalSqft control={form.control} index={index} />

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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : `Add ${fields.length > 1 ? "entries" : "entry"}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
