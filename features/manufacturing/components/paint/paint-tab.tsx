"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MaterialAddDialog,
  type MaterialEntryEditValues,
} from "@/features/manufacturing/components/shared/material-add-dialog";
import {
  MaterialEntryTable,
  type MaterialEntryRow,
} from "@/features/manufacturing/components/shared/material-entry-table";
import {
  useCreatePaintEntry,
  useDeletePaintEntry,
  usePaintOptions,
  useUpdatePaintEntry,
} from "@/features/manufacturing/hooks/use-manufacturing";
import type { ModelDto } from "@/types/dto";

interface PaintTabProps {
  lotId: string;
  model: ModelDto;
  readOnly?: boolean;
}

export function PaintTab({ lotId, model, readOnly }: PaintTabProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialEntryEditValues | null>(null);
  const { data: options } = usePaintOptions(open || !!editing);
  const createEntry = useCreatePaintEntry(lotId, model.id);
  const updateEntry = useUpdatePaintEntry(lotId);
  const deleteEntry = useDeletePaintEntry(lotId);

  const entries: MaterialEntryRow[] = model.paintEntries.map((e) => ({
    id: e.id,
    productId: e.paintProductId,
    name: e.paintName,
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
            Add Paint
          </Button>
        </div>
      )}

      <MaterialEntryTable
        nameHeader="Paint"
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
        title={editing ? "Edit Paint" : "Add Paint"}
        label="Paint"
        open={open}
        onOpenChange={handleOpenChange}
        options={options}
        presetItems={editing ? undefined : model.paintPresets}
        editingEntry={editing}
        isPending={createEntry.isPending || updateEntry.isPending}
        onSubmit={async (rows) => {
          if (editing) {
            await updateEntry.mutateAsync({
              entryId: editing.id,
              paintProductId: rows[0].inventoryId,
              quantity: rows[0].quantity,
            });
          } else {
            await createEntry.mutateAsync(
              rows.map((row) => ({
                paintProductId: row.inventoryId,
                quantity: row.quantity,
              }))
            );
          }
        }}
      />
    </div>
  );
}
