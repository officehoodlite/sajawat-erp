"use client";

import { useState } from "react";
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
import { WorkerRatesForm } from "@/features/manufacturing/components/workers/worker-rates-form";
import { LaborPerQtyTable } from "@/features/manufacturing/components/workers/labor-per-qty-table";
import { WorkerSummaryTable } from "@/features/manufacturing/components/workers/worker-summary-table";
import {
  useCreateLotWorkerEntries,
  useDeleteLotWorkerEntry,
  useUpdateLotWorkerEntry,
} from "@/features/manufacturing/hooks/use-manufacturing";
import { useCurrentUser } from "@/features/users/hooks/use-users";
import type { LotSummaryDto, LotWorkerEntryDto } from "@/types/dto";
import type { CreateLotWorkerEntryInput } from "@/validators/manufacturing";

interface WorkersTabProps {
  lot: LotSummaryDto;
  readOnly?: boolean;
}

export function WorkersTab({ lot, readOnly = false }: WorkersTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LotWorkerEntryDto | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<LotWorkerEntryDto | null>(null);

  const { data: me } = useCurrentUser();
  const canSeePrices = me?.workerPrices === true;
  const createEntries = useCreateLotWorkerEntries(lot.id);
  const updateEntry = useUpdateLotWorkerEntry(lot.id);
  const deleteEntryMutation = useDeleteLotWorkerEntry(lot.id);

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
      {canSeePrices ? (
        <WorkerRatesForm lotId={lot.id} rates={lot.workerRates} readOnly={readOnly} />
      ) : null}

      <ErpPageSection
        title="Worker Entries"
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

      {canSeePrices ? (
        <WorkerSummaryTable entries={lot.workerEntries} rates={lot.workerRates} />
      ) : null}

      {canSeePrices ? <LaborPerQtyTable lot={lot} readOnly={readOnly} /> : null}

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
