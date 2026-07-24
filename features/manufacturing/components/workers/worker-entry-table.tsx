"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import type { LotWorkerEntryDto } from "@/types/dto";
import { formatDate, formatNumber } from "@/utils/format";

interface WorkerEntryTableProps {
  entries: LotWorkerEntryDto[];
  readOnly?: boolean;
  onEdit?: (entry: LotWorkerEntryDto) => void;
  onDelete?: (entry: LotWorkerEntryDto) => void;
}

export function WorkerEntryTable({
  entries,
  readOnly = false,
  onEdit,
  onDelete,
}: WorkerEntryTableProps) {
  const columns: ColumnDef<LotWorkerEntryDto>[] = [
    {
      accessorKey: "workDate",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.workDate),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) =>
        row.original.type === "MANUFACTURING" ? "Manufacturing" : "Packing",
    },
    {
      accessorKey: "workerNames",
      header: "Workers",
      cell: ({ row }) => row.original.workerNames.join(", ") || "—",
    },
    {
      accessorKey: "machinery",
      header: "Machinery",
      cell: ({ row }) => row.original.machinery || "—",
    },
    {
      accessorKey: "mistri",
      header: "Mistri",
      cell: ({ row }) => formatNumber(row.original.mistri),
    },
    {
      accessorKey: "halfMistri",
      header: "Half Mistri",
      cell: ({ row }) => formatNumber(row.original.halfMistri),
    },
    {
      accessorKey: "helper",
      header: "Helper",
      cell: ({ row }) => formatNumber(row.original.helper),
    },
    {
      accessorKey: "hours",
      header: "Hours",
      cell: ({ row }) => formatNumber(row.original.hours),
    },
    {
      accessorKey: "packQty",
      header: "Pack Qty",
      cell: ({ row }) =>
        row.original.packQty != null ? formatNumber(row.original.packQty) : "—",
    },
    {
      accessorKey: "tMistri",
      header: "T-Mistri",
      cell: ({ row }) => formatNumber(row.original.tMistri),
    },
    {
      accessorKey: "hMistri",
      header: "H-Mistri",
      cell: ({ row }) => formatNumber(row.original.hMistri),
    },
    {
      accessorKey: "tHelper",
      header: "T-Helper",
      cell: ({ row }) => formatNumber(row.original.tHelper),
    },
    ...(readOnly
      ? []
      : [
          {
            id: "actions",
            header: "",
            cell: ({ row }: { row: { original: LotWorkerEntryDto } }) => (
              <div className="flex justify-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onEdit?.(row.original)}
                  aria-label="Edit entry"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDelete?.(row.original)}
                  aria-label="Delete entry"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ),
          } as ColumnDef<LotWorkerEntryDto>,
        ]),
  ];

  return <DataTable columns={columns} data={entries} />;
}
