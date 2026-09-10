"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ErpPageSection } from "@/components/shared/erp-page";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { WorkerEntryForm } from "@/features/manufacturing/components/workers/worker-entry-form";
import { WorkerEntryTable } from "@/features/manufacturing/components/workers/worker-entry-table";
import {
  useCreateLotWorkerEntries,
  useDeleteLotWorkerEntry,
  useUpdateLotWorkerEntry,
} from "@/features/manufacturing/hooks/use-manufacturing";
import type { LotSummaryDto, LotWorkerEntryDto } from "@/types/dto";
import type { CreateLotWorkerEntryInput } from "@/validators/manufacturing";

interface WorkersTabProps {
  lot: LotSummaryDto;
  readOnly?: boolean;
}

function uniqueWorkerCount(entries: LotWorkerEntryDto[]) {
  const names = new Set<string>();
  for (const entry of entries) {
    for (const name of entry.workerNames) {
      const trimmed = name.trim();
      if (trimmed) names.add(trimmed.toLowerCase());
    }
  }
  return names.size;
}

export function WorkersTab({ lot, readOnly = false }: WorkersTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LotWorkerEntryDto | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<LotWorkerEntryDto | null>(null);

  const createEntries = useCreateLotWorkerEntries(lot.id);
  const updateEntry = useUpdateLotWorkerEntry(lot.id);
  const deleteEntryMutation = useDeleteLotWorkerEntry(lot.id);
  const totalWorkers = useMemo(
    () => uniqueWorkerCount(lot.workerEntries),
    [lot.workerEntries]
  );

  const handleSubmit = async (entries: CreateLotWorkerEntryInput[]) => {
    if (editingEntry) {
      await updateEntry.mutateAsync({ entryId: editingEntry.id, ...entries[0] });
    } else {
      await createEntries.mutateAsync(entries);
    }
    setEditingEntry(null);
  };

  return (
    <div className="space-y-6">
      <ErpPageSection
        title="Worker Entries"
        description={`Total workers: ${totalWorkers}`}
        actions={
          !readOnly ? (
            <Button
              size="sm"
              onClick={() => {
                setEditingEntry(null);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              Add Workers
            </Button>
          ) : undefined
        }
      >
        <WorkerEntryTable
          entries={lot.workerEntries}
          readOnly={readOnly}
          onEdit={(entry) => {
            setEditingEntry(entry);
            setFormOpen(true);
          }}
          onDelete={setDeleteEntry}
        />
      </ErpPageSection>

      <WorkerEntryForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingEntry(null);
        }}
        entry={editingEntry}
        isPending={createEntries.isPending || updateEntry.isPending}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={!!deleteEntry} onOpenChange={() => setDeleteEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete worker entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this worker log entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteEntry) return;
                await deleteEntryMutation.mutateAsync(deleteEntry.id);
                setDeleteEntry(null);
              }}
              disabled={deleteEntryMutation.isPending}
            >
              {deleteEntryMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
