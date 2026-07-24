"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MaterialAddDialog,
  type MaterialEntryEditValues,
} from "@/features/manufacturing/components/shared/material-add-dialog";
import { HardwareTable } from "@/features/manufacturing/components/hardware/hardware-table";
import {
  useCreateHardwareEntry,
  useDeleteHardwareEntry,
  useHardwareOptions,
  useUpdateHardwareEntry,
} from "@/features/manufacturing/hooks/use-manufacturing";
import type { MaterialEntryRow } from "@/features/manufacturing/components/shared/material-entry-table";
import type { ModelDto } from "@/types/dto";

interface HardwareTabProps {
  lotId: string;
  model: ModelDto;
  readOnly?: boolean;
}

export function HardwareTab({ lotId, model, readOnly }: HardwareTabProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialEntryEditValues | null>(null);
  const { data: options } = useHardwareOptions(open || !!editing);
  const createEntry = useCreateHardwareEntry(lotId, model.id);
  const updateEntry = useUpdateHardwareEntry(lotId);
  const deleteEntry = useDeleteHardwareEntry(lotId);

  const entries: MaterialEntryRow[] = model.hardwareEntries.map((e) => ({
    id: e.id,
    productId: e.hardwareProductId,
    name: e.hardwareName,
    quantity: e.quantity,
    unit: e.unit,
  }));

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setEditing(null);
  };

  return (
    <div className="space-y-6">
      {!readOnly && (
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Hardware
          </Button>
        </div>
      )}

      <HardwareTable
        entries={entries}
        readOnly={readOnly}
        onEdit={
          readOnly
            ? undefined
            : (entry) => {
                setEditing({
                  id: entry.id,
                  inventoryId: entry.productId,
                  quantity: entry.quantity,
                });
                setOpen(true);
              }
        }
        onDelete={(id) => deleteEntry.mutate(id)}
      />

      <MaterialAddDialog
        title={editing ? "Edit Hardware" : "Add Hardware"}
        label="Hardware"
        quantityHeader="Qty / unit"
        quantityHint={`Per unit of model (× ${model.quantity} units = total stock deducted)`}
        open={open}
        onOpenChange={handleOpenChange}
        options={options}
        presetItems={editing ? undefined : model.hardwarePresets}
        editingEntry={editing}
        isPending={createEntry.isPending || updateEntry.isPending}
        onSubmit={async (rows) => {
          if (editing) {
            await updateEntry.mutateAsync({
              entryId: editing.id,
              hardwareProductId: rows[0].inventoryId,
              quantity: rows[0].quantity,
            });
          } else {
            await createEntry.mutateAsync(
              rows.map((row) => ({
                hardwareProductId: row.inventoryId,
                quantity: row.quantity,
              }))
            );
          }
        }}
      />
    </div>
  );
}
