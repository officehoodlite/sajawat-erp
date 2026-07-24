"use client";

import { MaterialEntryTable, type MaterialEntryRow } from "@/features/manufacturing/components/shared/material-entry-table";

interface PaintTableProps {
  entries: MaterialEntryRow[];
  readOnly?: boolean;
  onDelete: (entryId: string) => void;
}

export function PaintTable({ entries, readOnly, onDelete }: PaintTableProps) {
  return (
    <MaterialEntryTable
      nameHeader="Paint"
      entries={entries}
      readOnly={readOnly}
      onDelete={onDelete}
    />
  );
}

export type { MaterialEntryRow as PaintEntryRow };
