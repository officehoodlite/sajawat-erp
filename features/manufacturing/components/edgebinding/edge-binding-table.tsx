"use client";

import { MaterialEntryTable, type MaterialEntryRow } from "@/features/manufacturing/components/shared/material-entry-table";

interface EdgeBindingTableProps {
  entries: MaterialEntryRow[];
  readOnly?: boolean;
  onEdit?: (entry: MaterialEntryRow) => void;
  onDelete: (entryId: string) => void;
}

export function EdgeBindingTable({ entries, readOnly, onEdit, onDelete }: EdgeBindingTableProps) {
  return (
    <MaterialEntryTable
      nameHeader="Edge Binding"
      entries={entries}
      readOnly={readOnly}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}
