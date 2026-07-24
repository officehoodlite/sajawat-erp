"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/utils/format";
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

export interface MaterialEntryRow {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  productId: string;
}

interface MaterialEntryTableProps {
  nameHeader: string;
  entries: MaterialEntryRow[];
  readOnly?: boolean;
  onEdit?: (entry: MaterialEntryRow) => void;
  onDelete: (entryId: string) => void;
}

export function MaterialEntryTable({
  nameHeader,
  entries,
  readOnly,
  onEdit,
  onDelete,
}: MaterialEntryTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const columns: ColumnDef<MaterialEntryRow>[] = [
    {
      accessorKey: "name",
      header: nameHeader,
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => formatNumber(row.original.quantity),
    },
    { accessorKey: "unit", header: "Unit" },
    ...(!readOnly
      ? [
          {
            id: "actions",
            header: "Actions",
            cell: ({ row }: { row: { original: MaterialEntryRow } }) => (
              <div className="flex gap-1">
                {onEdit && (
                  <Button variant="ghost" size="icon-sm" onClick={() => onEdit(row.original)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(row.original.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ),
          } as ColumnDef<MaterialEntryRow>,
        ]
      : []),
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={entries}
        emptyTitle={`No ${nameHeader.toLowerCase()} entries`}
        emptyDescription={`Add ${nameHeader.toLowerCase()} to track usage for this model`}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the entry and restore the stock quantity.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
