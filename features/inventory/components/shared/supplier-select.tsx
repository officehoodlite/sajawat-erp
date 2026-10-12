"use client";

import { SearchableSelect } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { useSuppliers } from "@/features/inventory/hooks/use-suppliers";

interface SupplierSelectProps {
  value?: string;
  onChange: (value: string | undefined) => void;
}

const NONE_VALUE = "__none__";

export function SupplierSelect({ value, onChange }: SupplierSelectProps) {
  const { data: suppliers = [] } = useSuppliers();

  return (
    <div className="space-y-2">
      <Label>Supplier (optional)</Label>
      <SearchableSelect
        value={value || NONE_VALUE}
        onValueChange={(v) => onChange(v === NONE_VALUE || !v ? undefined : v)}
        items={[
          { value: NONE_VALUE, label: "None" },
          ...suppliers.map((s) => ({ value: s.id, label: s.name })),
        ]}
        placeholder="Select supplier (optional)"
        searchPlaceholder="Search suppliers..."
      />
    </div>
  );
}
