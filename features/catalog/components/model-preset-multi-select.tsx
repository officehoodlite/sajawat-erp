"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DECIMAL_INPUT_STEP } from "@/lib/decimal";
import { calcBoardEntrySqft } from "@/utils/board-calculations";
import { formatSqft } from "@/utils/format";

export interface PresetOption {
  id: string;
  label: string;
}

export interface BoardPresetDetail {
  length: number;
  width: number;
  quantity: number;
}

export interface QtyPresetDetail {
  quantity: number;
}

interface ModelPresetMultiSelectProps {
  label: string;
  options: PresetOption[];
  selectedIds: string[];
  onToggle: (id: string, checked: boolean) => void;
  details?: Record<string, BoardPresetDetail | QtyPresetDetail>;
  onDetailChange?: (id: string, patch: Partial<BoardPresetDetail & QtyPresetDetail>) => void;
  kind: "board" | "qty";
  isLoading?: boolean;
  emptyText?: string;
  listClassName?: string;
}

export function ModelPresetMultiSelect({
  label,
  options,
  selectedIds,
  onToggle,
  details,
  onDetailChange,
  kind,
  isLoading,
  emptyText = "No items available",
  listClassName = "max-h-36",
}: ModelPresetMultiSelectProps) {
  const selectedSet = new Set(selectedIds);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className={`overflow-y-auto rounded-lg border px-3 py-2 ${listClassName}`}>
        {isLoading ? (
          <p className="py-2 text-xs text-muted-foreground">Loading…</p>
        ) : options.length === 0 ? (
          <p className="py-2 text-xs text-muted-foreground">{emptyText}</p>
        ) : (
          <ul className="space-y-3">
            {options.map((opt) => {
              const checked = selectedSet.has(opt.id);
              const board = details?.[opt.id] as BoardPresetDetail | undefined;
              const qty = details?.[opt.id] as QtyPresetDetail | undefined;
              const sqft =
                kind === "board" && board && board.length > 0 && board.width > 0 && board.quantity > 0
                  ? calcBoardEntrySqft(board.length, board.width, board.quantity).totalSqft
                  : null;

              return (
                <li key={opt.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`${label}-${opt.id}`}
                      checked={checked}
                      onCheckedChange={(value) => onToggle(opt.id, value === true)}
                    />
                    <label
                      htmlFor={`${label}-${opt.id}`}
                      className="cursor-pointer text-sm leading-none"
                    >
                      {opt.label}
                    </label>
                  </div>
                  {checked && kind === "board" && board && onDetailChange ? (
                    <div className="ml-6 grid grid-cols-4 gap-2">
                      <Input
                        type="number"
                        min={0}
                        step={DECIMAL_INPUT_STEP}
                        placeholder="L"
                        aria-label={`${opt.label} length`}
                        value={Number.isFinite(board.length) && board.length !== 0 ? board.length : ""}
                        onChange={(e) =>
                          onDetailChange(opt.id, { length: Number(e.target.value) || 0 })
                        }
                      />
                      <Input
                        type="number"
                        min={0}
                        step={DECIMAL_INPUT_STEP}
                        placeholder="W"
                        aria-label={`${opt.label} width`}
                        value={Number.isFinite(board.width) && board.width !== 0 ? board.width : ""}
                        onChange={(e) =>
                          onDetailChange(opt.id, { width: Number(e.target.value) || 0 })
                        }
                      />
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        placeholder="Qty"
                        aria-label={`${opt.label} quantity`}
                        value={
                          Number.isFinite(board.quantity) && board.quantity !== 0
                            ? board.quantity
                            : ""
                        }
                        onChange={(e) =>
                          onDetailChange(opt.id, { quantity: Number(e.target.value) || 0 })
                        }
                      />
                      <div className="flex h-9 items-center text-xs text-muted-foreground">
                        {sqft != null ? formatSqft(sqft) : "sqft"}
                      </div>
                    </div>
                  ) : null}
                  {checked && kind === "qty" && qty && onDetailChange ? (
                    <div className="ml-6">
                      <Input
                        type="number"
                        min={0}
                        step={DECIMAL_INPUT_STEP}
                        placeholder="Quantity"
                        aria-label={`${opt.label} quantity`}
                        value={
                          Number.isFinite(qty.quantity) && qty.quantity !== 0 ? qty.quantity : ""
                        }
                        onChange={(e) =>
                          onDetailChange(opt.id, { quantity: Number(e.target.value) || 0 })
                        }
                      />
                    </div>
                  ) : null}
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
