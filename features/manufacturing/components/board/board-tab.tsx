"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardEntryForm } from "@/features/manufacturing/components/board/board-entry-form";
import { BoardEntryTable } from "@/features/manufacturing/components/board/board-entry-table";
import { BoardSummaryCard } from "@/features/manufacturing/components/board/board-summary-card";
import {
  useCreateBoardEntry,
  useDeleteBoardEntry,
  useUpdateBoardEntry,
} from "@/features/manufacturing/hooks/use-manufacturing";
import { getModelBoardSummary, getModelBoardTotal } from "@/features/manufacturing/utils/consumption";
import { calcBoardEntrySqft } from "@/utils/board-calculations";
import type { BoardEntryDto, ModelDto } from "@/types/dto";
import type { CreateBoardEntryInput } from "@/validators/manufacturing";

interface BoardTabProps {
  lotId: string;
  model: ModelDto;
  readOnly?: boolean;
}

export function BoardTab({ lotId, model, readOnly }: BoardTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BoardEntryDto | null>(null);

  const createEntry = useCreateBoardEntry(lotId, model.id);
  const updateEntry = useUpdateBoardEntry(lotId);
  const deleteEntry = useDeleteBoardEntry(lotId);

  const summary = getModelBoardSummary(model);
  const totalSqft = getModelBoardTotal(model);

  const handleSubmit = async (entries: CreateBoardEntryInput[]) => {
    if (editingEntry) {
      await updateEntry.mutateAsync({ entryId: editingEntry.id, data: entries[0] });
    } else {
      await createEntry.mutateAsync(entries);
    }
    setEditingEntry(null);
  };

  const openAdd = () => {
    setEditingEntry(null);
    setFormOpen(true);
  };

  const showingCatalogDefaults =
    model.boardEntries.length === 0 && model.boardPresets.length > 0;

  const openEdit = (entry: BoardEntryDto) => {
    setEditingEntry(entry);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      {!readOnly && (
        <div className="flex justify-end">
          <Button onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Board Entry
          </Button>
        </div>
      )}

      {showingCatalogDefaults ? (
        <p className="text-sm text-muted-foreground">
          Showing default boards from the product model. Add a board entry to assign a stock lot.
        </p>
      ) : null}
      <BoardEntryTable
        entries={
          model.boardEntries.length > 0
            ? model.boardEntries
            : model.boardPresets.map((preset) => {
                const { sqftPerPiece, totalSqft } = calcBoardEntrySqft(
                  preset.length,
                  preset.width,
                  preset.quantity
                );
                return {
                  id: `preset-${preset.boardThicknessId}-${preset.length}-${preset.width}-${preset.quantity}`,
                  modelId: model.id,
                  boardInventoryId: "",
                  materialName: preset.materialName,
                  thickness: preset.thickness,
                  length: preset.length,
                  width: preset.width,
                  quantity: preset.quantity,
                  sqftPerPiece,
                  totalSqft,
                };
              })
        }
        readOnly={readOnly || showingCatalogDefaults}
        onEdit={readOnly || showingCatalogDefaults ? undefined : openEdit}
        onDelete={(id) => deleteEntry.mutate(id)}
      />

      <BoardSummaryCard items={summary} totalSqft={totalSqft} modelQuantity={model.quantity} />

      <BoardEntryForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingEntry(null);
        }}
        onSubmit={handleSubmit}
        isPending={createEntry.isPending || updateEntry.isPending}
        entry={editingEntry}
        boardPresets={editingEntry ? undefined : model.boardPresets}
      />
    </div>
  );
}
