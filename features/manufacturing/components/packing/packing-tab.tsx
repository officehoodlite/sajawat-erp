"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MaterialAddDialog,
  type MaterialEntryEditValues,
} from "@/features/manufacturing/components/shared/material-add-dialog";
import { PackingTable } from "@/features/manufacturing/components/packing/packing-table";
import {
  useCreatePackingEntry,
  useDeletePackingEntry,
  usePackingOptions,
  useUpdatePackingEntry,
} from "@/features/manufacturing/hooks/use-manufacturing";
import type { MaterialEntryRow } from "@/features/manufacturing/components/shared/material-entry-table";
import type { ModelDto } from "@/types/dto";

interface PackingTabProps {
  lotId: string;
  model: ModelDto;
  readOnly?: boolean;
}

export function PackingTab({ lotId, model, readOnly }: PackingTabProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialEntryEditValues | null>(null);
  const { data: options } = usePackingOptions(open || !!editing);
  const createEntry = useCreatePackingEntry(lotId, model.id);
  const updateEntry = useUpdatePackingEntry(lotId);
  const deleteEntry = useDeletePackingEntry(lotId);

  const entries: MaterialEntryRow[] = model.packingEntries.map((e) => ({
    id: e.id,
    productId: e.packingProductId,
    name: e.packingName,
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
            Add Packing
          </Button>
        </div>
      )}

      <PackingTable
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
        title={editing ? "Edit Packing" : "Add Packing"}
        label="Packing"
        open={open}
        onOpenChange={handleOpenChange}
        options={options}
        presetItems={editing ? undefined : model.packingPresets}
        editingEntry={editing}
        isPending={createEntry.isPending || updateEntry.isPending}
        onSubmit={async (rows) => {
          if (editing) {
            await updateEntry.mutateAsync({
              entryId: editing.id,
              packingProductId: rows[0].inventoryId,
              quantity: rows[0].quantity,
            });
          } else {
            await createEntry.mutateAsync(
              rows.map((row) => ({
                packingProductId: row.inventoryId,
                quantity: row.quantity,
              }))
            );
          }
        }}
      />
    </div>
  );
}
