"use client";

import { useEffect, useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
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
import { computeLaborUnits } from "@/lib/worker-labor";
import type { LotWorkerEntryDto } from "@/types/dto";
import {
  createLotWorkerEntrySchema,
  type CreateLotWorkerEntryInput,
} from "@/validators/manufacturing";
import { formatNumber } from "@/utils/format";

const workerMultiFormSchema = z.object({
  rows: z.array(createLotWorkerEntrySchema).min(1, "Add at least one row"),
});

interface WorkerEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (entries: CreateLotWorkerEntryInput[]) => Promise<void>;
  isPending?: boolean;
  entry?: LotWorkerEntryDto | null;
}

const emptyRow = (): CreateLotWorkerEntryInput => ({
  type: "MANUFACTURING",
  workDate: new Date(),
  workerNames: [""],
  machinery: "",
  mistri: 0,
  halfMistri: 0,
  helper: 0,
  hours: 1,
  packQty: undefined,
});

function WorkerRowComputed({
  mistri,
  halfMistri,
  helper,
  hours,
}: {
  mistri: number;
  halfMistri: number;
  helper: number;
  hours: number;
}) {
  const units = useMemo(
    () => computeLaborUnits(mistri, halfMistri, helper, hours),
    [mistri, halfMistri, helper, hours]
  );

  return (
    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
      <span>T-Mistri: {formatNumber(units.tMistri)}</span>
      <span>H-Mistri: {formatNumber(units.hMistri)}</span>
      <span>T-Helper: {formatNumber(units.tHelper)}</span>
    </div>
  );
}

function WorkerNamesFields({
  entryIndex,
  form,
}: {
  entryIndex: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `rows.${entryIndex}.workerNames`,
  });

  return (
    <div className="space-y-2 sm:col-span-2">
      <Label required>Workers</Label>
      <div className="space-y-2">
        {fields.map((field, nameIndex) => (
          <div key={field.id} className="flex gap-2">
            <Input
              {...form.register(`rows.${entryIndex}.workerNames.${nameIndex}` as const)}
              placeholder="Worker name"
            />
            {fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => remove(nameIndex)}
                aria-label="Remove worker"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append("")}
      >
        <Plus className="mr-2 size-4" />
        Add worker
      </Button>
      {form.formState.errors.rows?.[entryIndex]?.workerNames && (
        <p className="text-xs text-destructive">
          {typeof form.formState.errors.rows[entryIndex]?.workerNames?.message === "string"
            ? form.formState.errors.rows[entryIndex]?.workerNames?.message
            : "Add at least one worker name"}
        </p>
      )}
    </div>
  );
}

function WorkerRowFields({
  index,
  form,
  isEdit,
  fieldsLength,
  onRemove,
}: {
  index: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  isEdit: boolean;
  fieldsLength: number;
  onRemove: (index: number) => void;
}) {
  const type = form.watch(`rows.${index}.type`);
  const workDate = form.watch(`rows.${index}.workDate`);
  const mistri = Number(form.watch(`rows.${index}.mistri`)) || 0;
  const halfMistri = Number(form.watch(`rows.${index}.halfMistri`)) || 0;
  const helper = Number(form.watch(`rows.${index}.helper`)) || 0;
  const hours = Number(form.watch(`rows.${index}.hours`)) || 0;
  const rowErrors = form.formState.errors.rows?.[index];
  const dateValue =
    workDate instanceof Date && !Number.isNaN(workDate.getTime())
      ? workDate.toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Entry {index + 1}</span>
        {!isEdit && fieldsLength > 1 && (
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => onRemove(index)}>
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label required>Type</Label>
          <Select
            value={type}
            onValueChange={(v) =>
              form.setValue(`rows.${index}.type`, v as "MANUFACTURING" | "PACKING")
            }
            items={[
              { value: "MANUFACTURING", label: "Manufacturing" },
              { value: "PACKING", label: "Packing" },
            ]}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MANUFACTURING">Manufacturing</SelectItem>
              <SelectItem value="PACKING">Packing</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label required>Date</Label>
          <Input
            type="date"
            value={dateValue}
            onChange={(e) =>
              form.setValue(`rows.${index}.workDate`, new Date(e.target.value), {
                shouldValidate: true,
              })
            }
          />
          {rowErrors?.workDate && (
            <p className="text-xs text-destructive">{rowErrors.workDate.message}</p>
          )}
        </div>
        <WorkerNamesFields entryIndex={index} form={form} />
        <div className="space-y-2">
          <Label>Machinery</Label>
          <Input {...form.register(`rows.${index}.machinery`)} />
        </div>
        <div className="space-y-2">
          <Label required>Hours</Label>
          <Input
            type="number"
            step="1"
            {...form.register(`rows.${index}.hours`, { valueAsNumber: true })}
          />
          {rowErrors?.hours && (
            <p className="text-xs text-destructive">{rowErrors.hours.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Mistri</Label>
          <Input
            type="number"
            step="1"
            {...form.register(`rows.${index}.mistri`, { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label>Half Mistri</Label>
          <Input
            type="number"
            step="1"
            {...form.register(`rows.${index}.halfMistri`, { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label>Helper</Label>
          <Input
            type="number"
            step="1"
            {...form.register(`rows.${index}.helper`, { valueAsNumber: true })}
          />
        </div>
        {type === "PACKING" && (
          <div className="space-y-2">
            <Label required>Pack Qty</Label>
            <Input
              type="number"
              step="1"
              {...form.register(`rows.${index}.packQty`, { valueAsNumber: true })}
            />
            {rowErrors?.packQty && (
              <p className="text-xs text-destructive">{rowErrors.packQty.message}</p>
            )}
          </div>
        )}
      </div>
      <WorkerRowComputed mistri={mistri} halfMistri={halfMistri} helper={helper} hours={hours} />
    </div>
  );
}

export function WorkerEntryForm({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  entry,
}: WorkerEntryFormProps) {
  const isEdit = !!entry;

  const form = useForm({
    resolver: zodResolver(workerMultiFormSchema),
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
            type: entry.type,
            workDate: new Date(entry.workDate),
            workerNames: entry.workerNames.length > 0 ? entry.workerNames : [""],
            machinery: entry.machinery ?? "",
            mistri: entry.mistri,
            halfMistri: entry.halfMistri,
            helper: entry.helper,
            hours: entry.hours,
            packQty: entry.packQty ?? undefined,
          },
        ],
      });
    } else {
      form.reset({ rows: [emptyRow()] });
    }
  }, [open, entry, form]);

  const handleSubmit = form.handleSubmit(
    async (data) => {
      try {
        await onSubmit(
          data.rows.map((row: CreateLotWorkerEntryInput) => ({
            ...row,
            workerNames: row.workerNames.map((n) => n.trim()).filter(Boolean),
            machinery: row.machinery || undefined,
            packQty: row.type === "PACKING" ? row.packQty : undefined,
          }))
        );
        onOpenChange(false);
      } catch {
        // Mutation hook shows the API error toast.
      }
    },
    () => {
      toast.error("Please complete all required fields before saving.");
    }
  );

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Worker Entry" : "Add Worker Entries"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field, index) => (
            <WorkerRowFields
              key={field.id}
              index={index}
              form={form}
              isEdit={isEdit}
              fieldsLength={fields.length}
              onRemove={remove}
            />
          ))}

          {!isEdit && (
            <Button type="button" variant="outline" onClick={() => append(emptyRow())}>
              <Plus className="mr-2 size-4" />
              Add Another Entry
            </Button>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Entries"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
