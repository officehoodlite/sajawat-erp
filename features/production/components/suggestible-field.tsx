"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CUSTOM = "__custom__";

interface SuggestibleFieldProps {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
}

/** Dropdown of prior values + custom free text. */
export function SuggestibleField({
  id,
  label,
  required,
  value,
  onChange,
  suggestions,
  placeholder,
}: SuggestibleFieldProps) {
  const inSuggestions = suggestions.includes(value);
  const [mode, setMode] = useState<"pick" | "custom">(
    !suggestions.length || (value && !inSuggestions) ? "custom" : "pick"
  );

  const items = useMemo(
    () => [
      ...suggestions.map((s) => ({ value: s, label: s })),
      { value: CUSTOM, label: "Custom…" },
    ],
    [suggestions]
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <Select
        value={mode === "custom" ? CUSTOM : value || null}
        onValueChange={(v) => {
          if (!v) return;
          if (v === CUSTOM) {
            setMode("custom");
            if (inSuggestions) onChange("");
            return;
          }
          setMode("pick");
          onChange(v);
        }}
        items={items}
      >
        <SelectTrigger className="w-full" id={id}>
          <SelectValue placeholder={placeholder ?? "Select or custom"} />
        </SelectTrigger>
        <SelectContent>
          {suggestions.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
          <SelectItem value={CUSTOM}>Custom…</SelectItem>
        </SelectContent>
      </Select>
      {mode === "custom" && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Enter custom value"}
        />
      )}
    </div>
  );
}
