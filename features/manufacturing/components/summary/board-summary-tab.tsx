"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ErpPageSection } from "@/components/shared/erp-page";
import { DataTable } from "@/components/shared/data-table";
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
import { ActualBoardEntryForm } from "@/features/manufacturing/components/summary/actual-board-entry-form";
import { BoardActualConsumptionTable } from "@/features/manufacturing/components/summary/board-actual-consumption-table";
import { GroupedConsumptionTable } from "@/features/manufacturing/components/summary/grouped-consumption-table";
import { BoardWastageTable } from "@/features/manufacturing/components/summary/board-wastage-table";
import {
  useCreateLotActualBoardEntry,
  useDeleteLotActualBoardEntry,
  useUpdateLotActualBoardEntry,
} from "@/features/manufacturing/hooks/use-manufacturing";
import type { LotActualBoardEntryDto, LotSummaryDto } from "@/types/dto";
import { formatNumber, formatSqft } from "@/utils/format";
import type { CreateLotActualBoardEntryInput } from "@/validators/manufacturing";

interface BoardSummaryTabProps {
  lot: LotSummaryDto;
  readOnly?: boolean;
}

export function BoardSummaryTab({ lot, readOnly = false }: BoardSummaryTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LotActualBoardEntryDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const createEntry = useCreateLotActualBoardEntry(lot.id);
  const updateEntry = useUpdateLotActualBoardEntry(lot.id);
  const deleteEntry = useDeleteLotActualBoardEntry(lot.id);

  const handleSubmit = async (entries: CreateLotActualBoardEntryInput[]) => {
    if (editingEntry) {
      await updateEntry.mutateAsync({ entryId: editingEntry.id, ...entries[0] });
    } else {
      await createEntry.mutateAsync(entries);
    }
    setEditingEntry(null);
  };

  const actualColumns: ColumnDef<LotActualBoardEntryDto>[] = [
    {
      header: "Material",
      cell: ({ row }) => `${row.original.materialName} ${row.original.thickness}`,
    },
    {
      accessorKey: "length",
      header: "Length (sqft)",
      cell: ({ row }) => formatNumber(row.original.length),
    },
    {
      accessorKey: "width",
      header: "Width (sqft)",
      cell: ({ row }) => formatNumber(row.original.width),
    },
    { accessorKey: "quantity", header: "Qty", cell: ({ row }) => row.original.quantity },
    {
      accessorKey: "sqftIn",
      header: "In (sqft)",
      cell: ({ row }) => formatNumber(row.original.sqftIn),
    },
    {
      accessorKey: "sqftOut",
      header: "Out (sqft)",
      cell: ({ row }) => formatNumber(row.original.sqftOut),
    },
    {
      accessorKey: "totalSqft",
      header: "Net SqFt",
      cell: ({ row }) => (
        <span className="font-semibold text-primary">{formatSqft(row.original.totalSqft)}</span>
      ),
    },
    ...(!readOnly
      ? [
          {
            id: "actions",
            header: "",
            cell: ({ row }: { row: { original: LotActualBoardEntryDto } }) => (
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setEditingEntry(row.original);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeleteId(row.original.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ),
          } as ColumnDef<LotActualBoardEntryDto>,
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <GroupedConsumptionTable
        title="Calculated Usage (Carpenter)"
        nameHeader="Material"
        valueHeader="Total SqFt"
        rows={lot.boardUsageSummary.map((item) => ({
          name: item.materialLabel,
          value: item.totalSqft,
        }))}
        formatAsSqft
        emptyMessage="No calculated board usage from models yet."
      />

      <ErpPageSection
        title="Actual Usage (Admin)"
        description="Record what was actually cut from stock for this lot."
        actions={
          !readOnly ? (
            <Button
              onClick={() => {
                setEditingEntry(null);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
          ) : undefined
        }
      >
        <DataTable
          columns={actualColumns}
          data={lot.actualBoardEntries}
          emptyTitle="No actual board entries"
          emptyDescription="Add entries for each size/qty actually used before completing the lot."
          emptyAction={
            !readOnly ? (
              <Button
                onClick={() => {
                  setEditingEntry(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Entry
              </Button>
            ) : undefined
          }
        />
      </ErpPageSection>

      <BoardWastageTable
        rows={lot.boardWastageSummary}
        totalCalculated={lot.totalBoardSqft}
        totalActual={lot.totalActualBoardSqft}
      />

      <BoardActualConsumptionTable rows={lot.boardActualConsumption} models={lot.models} />

      {formOpen && (
        <ActualBoardEntryForm
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditingEntry(null);
          }}
          entry={editingEntry}
          onSubmit={handleSubmit}
          isPending={createEntry.isPending || updateEntry.isPending}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete actual board entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the entry from actual usage for this lot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteId) {
                  await deleteEntry.mutateAsync(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
