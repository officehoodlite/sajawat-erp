"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
      <Select
        value={value || NONE_VALUE}
        onValueChange={(v) => onChange(v === NONE_VALUE || !v ? undefined : v)}
        items={[
          { value: NONE_VALUE, label: "None" },
          ...suppliers.map((s) => ({ value: s.id, label: s.name })),
        ]}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select supplier (optional)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>None</SelectItem>
          {suppliers.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
