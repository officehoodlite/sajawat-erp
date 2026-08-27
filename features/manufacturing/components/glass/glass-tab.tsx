"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MaterialAddDialog,
  type MaterialEntryEditValues,
} from "@/features/manufacturing/components/shared/material-add-dialog";
import { GlassTable } from "@/features/manufacturing/components/glass/glass-table";
import {
  useCreateGlassEntry,
  useDeleteGlassEntry,
  useGlassOptions,
  useUpdateGlassEntry,
} from "@/features/manufacturing/hooks/use-manufacturing";
import type { MaterialEntryRow } from "@/features/manufacturing/components/shared/material-entry-table";
import type { ModelDto } from "@/types/dto";

interface GlassTabProps {
  lotId: string;
  model: ModelDto;
  readOnly?: boolean;
}

export function GlassTab({ lotId, model, readOnly }: GlassTabProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialEntryEditValues | null>(null);
  const { data: options } = useGlassOptions(open || !!editing);
  const createEntry = useCreateGlassEntry(lotId, model.id);
  const updateEntry = useUpdateGlassEntry(lotId);
  const deleteEntry = useDeleteGlassEntry(lotId);

  const entries: MaterialEntryRow[] = model.glassEntries.map((e) => ({
    id: e.id,
    productId: e.glassProductId,
    name: e.glassName,
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
            Add Glass
          </Button>
        </div>
      )}

      <GlassTable
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
        title={editing ? "Edit Glass" : "Add Glass"}
        label="Glass"
        open={open}
        onOpenChange={handleOpenChange}
        options={options}
        presetItems={editing ? undefined : model.glassPresets}
        editingEntry={editing}
        isPending={createEntry.isPending || updateEntry.isPending}
        onSubmit={async (rows) => {
          if (editing) {
            await updateEntry.mutateAsync({
              entryId: editing.id,
              glassProductId: rows[0].inventoryId,
              quantity: rows[0].quantity,
            });
          } else {
            await createEntry.mutateAsync(
              rows.map((row) => ({
                glassProductId: row.inventoryId,
                quantity: row.quantity,
              }))
            );
          }
        }}
      />
    </div>
  );
}
