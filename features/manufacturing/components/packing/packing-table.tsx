"use client";

import { MaterialEntryTable, type MaterialEntryRow } from "@/features/manufacturing/components/shared/material-entry-table";

interface PackingTableProps {
  entries: MaterialEntryRow[];
  readOnly?: boolean;
  onEdit?: (entry: MaterialEntryRow) => void;
  onDelete: (entryId: string) => void;
}

export function PackingTable({ entries, readOnly, onEdit, onDelete }: PackingTableProps) {
  return (
    <MaterialEntryTable
      nameHeader="Packing"
      entries={entries}
      readOnly={readOnly}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}
