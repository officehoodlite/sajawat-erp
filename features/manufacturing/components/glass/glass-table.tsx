"use client";

import { MaterialEntryTable, type MaterialEntryRow } from "@/features/manufacturing/components/shared/material-entry-table";

interface GlassTableProps {
  entries: MaterialEntryRow[];
  readOnly?: boolean;
  onEdit?: (entry: MaterialEntryRow) => void;
  onDelete: (entryId: string) => void;
}

export function GlassTable({ entries, readOnly, onEdit, onDelete }: GlassTableProps) {
  return (
    <MaterialEntryTable
      nameHeader="Glass"
      entries={entries}
      readOnly={readOnly}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}
