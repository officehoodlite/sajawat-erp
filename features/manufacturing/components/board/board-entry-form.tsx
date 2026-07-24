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
  createBoardEntrySchema,
  type CreateBoardEntryInput,
} from "@/validators/manufacturing";
import { DECIMAL_INPUT_STEP } from "@/lib/decimal";
import { useBoardOptions } from "@/features/manufacturing/hooks/use-manufacturing";
import { calcBoardEntrySqft } from "@/utils/board-calculations";
import { formatSqft } from "@/utils/format";
import type { BoardEntryDto, ModelBoardPresetDto } from "@/types/dto";

const boardMultiFormSchema = z.object({
  rows: z.array(createBoardEntrySchema).min(1, "Add at least one row"),
});

type BoardMultiFormValues = z.infer<typeof boardMultiFormSchema>;

interface BoardEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (entries: CreateBoardEntryInput[]) => Promise<void>;
  isPending?: boolean;
  entry?: BoardEntryDto | null;
  boardPresets?: ModelBoardPresetDto[];
}

type BoardRowDraft = CreateBoardEntryInput & {
  presetLabel?: string;
};

const emptyRow = (): BoardRowDraft => ({
  boardInventoryId: "",
  length: 0,
  width: 0,
  quantity: 1,
});

function BoardRowTotalSqft({
  control,
  index,
}: {
  control: Control<BoardMultiFormValues>;
  index: number;
}) {
  const length = useWatch({ control, name: `rows.${index}.length` });
  const width = useWatch({ control, name: `rows.${index}.width` });
  const quantity = useWatch({ control, name: `rows.${index}.quantity` });

  const totalSqft = useMemo(() => {
    const l = Number(length);
    const w = Number(width);
    const q = Number(quantity);
    if (!l || !w || !q) return null;
    return calcBoardEntrySqft(l, w, q).totalSqft;
  }, [length, width, quantity]);

  return (
    <div className="flex h-9 items-center justify-end px-1">
      <span className="text-sm font-medium text-primary">
        {totalSqft != null ? formatSqft(totalSqft) : "—"}
      </span>
    </div>
  );
}

function buildPresetRows(
  presets: ModelBoardPresetDto[],
  options: Array<{ id: string; boardThicknessId?: string }> | undefined
): BoardRowDraft[] {
  return presets.map((preset) => {
    const matches =
      options?.filter((opt) => opt.boardThicknessId === preset.boardThicknessId) ?? [];
    return {
      boardInventoryId: matches.length === 1 ? matches[0].id : "",
      length: 0,
      width: 0,
      quantity: 1,
      presetLabel: preset.label,
    };
  });
}

export function BoardEntryForm({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  entry,
  boardPresets = [],
}: BoardEntryFormProps) {
  const { data: options } = useBoardOptions(open);
  const isEdit = !!entry;

  const form = useForm<BoardMultiFormValues>({
    resolver: zodResolver(boardMultiFormSchema),
    mode: "onSubmit",
    defaultValues: { rows: [emptyRow()] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rows",
  });

  const presetLabels = useMemo(() => {
    if (isEdit || boardPresets.length === 0) return [] as string[];
    return boardPresets.map((p) => p.label);
  }, [isEdit, boardPresets]);

  useEffect(() => {
    if (!open) return;
    if (entry) {
      form.reset({
        rows: [
          {
            boardInventoryId: entry.boardInventoryId,
            length: entry.length,
            width: entry.width,
            quantity: entry.quantity,
          },
        ],
      });
      return;
    }
    if (boardPresets.length > 0) {
      form.reset({ rows: buildPresetRows(boardPresets, options) });
      return;
    }
    form.reset({ rows: [emptyRow()] });
    // options intentionally omitted: a later effect fills inventory matches without wiping edits
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when dialog context changes
  }, [open, entry, boardPresets, form]);

  useEffect(() => {
    if (!open || entry || !options || boardPresets.length === 0) return;
    const rows = form.getValues("rows");
    let changed = false;
    const next = rows.map((row, index) => {
      if (row.boardInventoryId) return row;
      const preset = boardPresets[index];
      if (!preset) return row;
      const matches = options.filter((opt) => opt.boardThicknessId === preset.boardThicknessId);
      if (matches.length !== 1) return row;
      changed = true;
      return { ...row, boardInventoryId: matches[0].id };
    });
    if (changed) form.setValue("rows", next);
  }, [open, entry, options, boardPresets, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    onOpenChange(false);
    await onSubmit(data.rows);
  });

  if (!open) return null;

  const selectItems = options?.map((opt) => ({ value: opt.id, label: opt.label })) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Board Entry" : "Add Board Entries"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="overflow-hidden rounded-lg border">
            <div className="grid grid-cols-[minmax(160px,1.4fr)_88px_88px_72px_108px_36px] gap-3 border-b bg-muted/40 px-3 py-2.5 text-xs font-medium text-muted-foreground">
              <span>Board</span>
              <span>Length</span>
              <span>Width</span>
              <span>Qty / unit</span>
              <span className="text-right">SqFt / unit</span>
              <span />
            </div>

            <div className="max-h-[min(50vh,400px)] overflow-y-auto">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-[minmax(160px,1.4fr)_88px_88px_72px_108px_36px] gap-3 border-b px-3 py-3 last:border-b-0"
                >
                  <div className="space-y-1">
                    <Select
                      value={form.watch(`rows.${index}.boardInventoryId`) || null}
                      onValueChange={(v) => form.setValue(`rows.${index}.boardInventoryId`, v ?? "")}
                      items={selectItems}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select board" />
                      </SelectTrigger>
                      <SelectContent>
                        {options?.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!isEdit &&
                      !form.watch(`rows.${index}.boardInventoryId`) &&
                      presetLabels[index] && (
                        <p className="text-xs text-muted-foreground">
                          Suggested: {presetLabels[index]}
                        </p>
                      )}
                    {form.formState.errors.rows?.[index]?.boardInventoryId && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.rows[index]?.boardInventoryId?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Input
                      type="number"
                      step={DECIMAL_INPUT_STEP}
                      min={DECIMAL_INPUT_STEP}
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
                      min={DECIMAL_INPUT_STEP}
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
                      min={1}
                      {...form.register(`rows.${index}.quantity`, { valueAsNumber: true })}
                    />
                    {form.formState.errors.rows?.[index]?.quantity && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.rows[index]?.quantity?.message}
                      </p>
                    )}
                  </div>

                  <BoardRowTotalSqft control={form.control} index={index} />

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
