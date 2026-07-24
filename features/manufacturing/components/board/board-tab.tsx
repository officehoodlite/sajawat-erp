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

      <BoardEntryTable
        entries={model.boardEntries}
        readOnly={readOnly}
        onEdit={readOnly ? undefined : openEdit}
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
