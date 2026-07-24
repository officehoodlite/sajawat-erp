"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface PresetOption {
  id: string;
  label: string;
}

interface ModelPresetMultiSelectProps {
  label: string;
  options: PresetOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  isLoading?: boolean;
  emptyText?: string;
  listClassName?: string;
}

export function ModelPresetMultiSelect({
  label,
  options,
  selectedIds,
  onChange,
  isLoading,
  emptyText = "No items available",
  listClassName = "max-h-36",
}: ModelPresetMultiSelectProps) {
  const selectedSet = new Set(selectedIds);

  const toggle = (id: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedIds, id]);
      return;
    }
    onChange(selectedIds.filter((x) => x !== id));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className={`overflow-y-auto rounded-lg border px-3 py-2 ${listClassName}`}>
        {isLoading ? (
          <p className="py-2 text-xs text-muted-foreground">Loading…</p>
        ) : options.length === 0 ? (
          <p className="py-2 text-xs text-muted-foreground">{emptyText}</p>
        ) : (
          <ul className="space-y-2">
            {options.map((opt) => {
              const checked = selectedSet.has(opt.id);
              return (
                <li key={opt.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`${label}-${opt.id}`}
                    checked={checked}
                    onCheckedChange={(value) => toggle(opt.id, value === true)}
                  />
                  <label
                    htmlFor={`${label}-${opt.id}`}
                    className="cursor-pointer text-sm leading-none"
                  >
                    {opt.label}
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {selectedIds.length > 0 ? (
        <p className="text-xs text-muted-foreground">{selectedIds.length} selected</p>
      ) : null}
    </div>
  );
}
