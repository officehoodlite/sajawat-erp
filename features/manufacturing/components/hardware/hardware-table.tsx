"use client";

import { MaterialEntryTable, type MaterialEntryRow } from "@/features/manufacturing/components/shared/material-entry-table";

interface HardwareTableProps {
  entries: MaterialEntryRow[];
  readOnly?: boolean;
  onEdit?: (entry: MaterialEntryRow) => void;
  onDelete: (entryId: string) => void;
}

export function HardwareTable({ entries, readOnly, onEdit, onDelete }: HardwareTableProps) {
  return (
    <MaterialEntryTable
      nameHeader="Hardware"
      entries={entries}
      readOnly={readOnly}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}
