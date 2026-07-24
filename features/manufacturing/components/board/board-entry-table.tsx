"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
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
import { formatNumber } from "@/utils/format";
import type { BoardEntryDto } from "@/types/dto";

interface BoardEntryTableProps {
  entries: BoardEntryDto[];
  readOnly?: boolean;
  onEdit?: (entry: BoardEntryDto) => void;
  onDelete: (entryId: string) => void;
}

export function BoardEntryTable({ entries, readOnly, onEdit, onDelete }: BoardEntryTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const columns: ColumnDef<BoardEntryDto>[] = [
    {
      accessorKey: "materialName",
      header: "Material",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.materialName} {row.original.thickness}
        </span>
      ),
    },
    { accessorKey: "length", header: "Length", cell: ({ row }) => formatNumber(row.original.length) },
    { accessorKey: "width", header: "Width", cell: ({ row }) => formatNumber(row.original.width) },
    { accessorKey: "quantity", header: "Quantity" },
    {
      accessorKey: "sqftPerPiece",
      header: "SqFt/Piece",
      cell: ({ row }) => formatNumber(row.original.sqftPerPiece),
    },
    {
      accessorKey: "totalSqft",
      header: "Total SqFt",
      cell: ({ row }) => (
        <span className="font-medium text-primary">{formatNumber(row.original.totalSqft)}</span>
      ),
    },
    ...(!readOnly
      ? [
          {
            id: "actions",
            header: "Actions",
            cell: ({ row }: { row: { original: BoardEntryDto } }) => (
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
          } as ColumnDef<BoardEntryDto>,
        ]
      : []),
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={entries}
        emptyTitle="No board entries"
        emptyDescription="Add board entries to track material usage for this model"
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete board entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the board entry from this model. This action cannot be undone.
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
