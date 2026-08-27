"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MaterialAddDialog,
  type MaterialEntryEditValues,
} from "@/features/manufacturing/components/shared/material-add-dialog";
import { EdgeBindingTable } from "@/features/manufacturing/components/edgebinding/edge-binding-table";
import {
  useCreateEdgeBindingEntry,
  useDeleteEdgeBindingEntry,
  useEdgeBindingOptions,
  useUpdateEdgeBindingEntry,
} from "@/features/manufacturing/hooks/use-manufacturing";
import type { MaterialEntryRow } from "@/features/manufacturing/components/shared/material-entry-table";
import type { ModelDto } from "@/types/dto";

interface EdgeBindingTabProps {
  lotId: string;
  model: ModelDto;
  readOnly?: boolean;
}

export function EdgeBindingTab({ lotId, model, readOnly }: EdgeBindingTabProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialEntryEditValues | null>(null);
  const { data: options } = useEdgeBindingOptions(open || !!editing);
  const createEntry = useCreateEdgeBindingEntry(lotId, model.id);
  const updateEntry = useUpdateEdgeBindingEntry(lotId);
  const deleteEntry = useDeleteEdgeBindingEntry(lotId);

  const entries: MaterialEntryRow[] = model.edgeBindingEntries.map((e) => ({
    id: e.id,
    productId: e.edgeBindingProductId,
    name: e.edgeBindingName,
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
            Add Edge Binding
          </Button>
        </div>
      )}

      <EdgeBindingTable
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
        title={editing ? "Edit Edge Binding" : "Add Edge Binding"}
        label="Edge Binding"
        open={open}
        onOpenChange={handleOpenChange}
        options={options}
        presetItems={editing ? undefined : model.edgeBindingPresets}
        editingEntry={editing}
        isPending={createEntry.isPending || updateEntry.isPending}
        onSubmit={async (rows) => {
          if (editing) {
            await updateEntry.mutateAsync({
              entryId: editing.id,
              edgeBindingProductId: rows[0].inventoryId,
              quantity: rows[0].quantity,
            });
          } else {
            await createEntry.mutateAsync(
              rows.map((row) => ({
                edgeBindingProductId: row.inventoryId,
                quantity: row.quantity,
              }))
            );
          }
        }}
      />
    </div>
  );
}
