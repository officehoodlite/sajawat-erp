"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ErpPageSection } from "@/components/shared/erp-page";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkerEntryForm } from "@/features/manufacturing/components/workers/worker-entry-form";
import {
  useCreateBulkLotWorkerEntries,
  useLots,
} from "@/features/manufacturing/hooks/use-manufacturing";
import type { CreateLotWorkerEntryInput } from "@/validators/manufacturing";
import { formatDate, formatNumber } from "@/utils/format";

type DraftEntry = CreateLotWorkerEntryInput & { key: string };

function newKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ManufacturingWorkersTab() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [selectedLotIds, setSelectedLotIds] = useState<string[]>([]);
  const [draftEntries, setDraftEntries] = useState<DraftEntry[]>([]);
  const [formOpen, setFormOpen] = useState(false);

  const { data, isLoading } = useLots(1, 100, debouncedSearch);
  const createBulk = useCreateBulkLotWorkerEntries();

  const lots = data?.items ?? [];
  const selectedSet = useMemo(() => new Set(selectedLotIds), [selectedLotIds]);
  const selectedLots = useMemo(
    () => lots.filter((lot) => selectedSet.has(lot.id)),
    [lots, selectedSet]
  );

  const toggleLot = (id: string) => {
    setSelectedLotIds((current) =>
      current.includes(id) ? current.filter((lotId) => lotId !== id) : [...current, id]
    );
  };

  const selectAllVisible = () => {
    setSelectedLotIds((current) => {
      const next = new Set(current);
      for (const lot of lots) next.add(lot.id);
      return Array.from(next);
    });
  };

  const clearLots = () => setSelectedLotIds([]);

  const handleAddToDraft = async (entries: CreateLotWorkerEntryInput[]) => {
    setDraftEntries((current) => [
      ...current,
      ...entries.map((entry) => ({ ...entry, key: newKey() })),
    ]);
  };

  const removeDraft = (key: string) => {
    setDraftEntries((current) => current.filter((entry) => entry.key !== key));
  };

  const handleUpload = async () => {
    if (selectedLotIds.length === 0) return;
    if (draftEntries.length === 0) return;
    const entries = draftEntries.map(({ key: _key, ...entry }) => entry);
    await createBulk.mutateAsync({ lotIds: selectedLotIds, entries });
    setDraftEntries([]);
  };

  const canUpload = selectedLotIds.length > 0 && draftEntries.length > 0 && !createBulk.isPending;

  return (
    <div className="space-y-6">
      <ErpPageSection
        title="1. Select lots"
        description="Pick the lots that should receive the worker entries."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={selectAllVisible} disabled={lots.length === 0}>
              Select visible
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearLots}
              disabled={selectedLotIds.length === 0}
            >
              Clear
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="lotPickerSearch">Search lots</Label>
            <Input
              id="lotPickerSearch"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Lot number"
            />
          </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading lots…</p>
          ) : lots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No lots found.</p>
          ) : (
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-border p-3">
              {lots.map((lot) => (
                <label
                  key={lot.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/60"
                >
                  <Checkbox
                    checked={selectedSet.has(lot.id)}
                    onCheckedChange={() => toggleLot(lot.id)}
                  />
                  <span className="font-medium">{lot.lotNumber}</span>
                  <span className="text-muted-foreground">· {lot.modelCount} models</span>
                </label>
              ))}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {selectedLotIds.length === 0
              ? "No lots selected."
              : `${selectedLotIds.length} lot${selectedLotIds.length === 1 ? "" : "s"} selected${
                  selectedLots.length > 0
                    ? `: ${selectedLots.map((lot) => lot.lotNumber).join(", ")}`
                    : ""
                }.`}
          </p>
        </div>
      </ErpPageSection>

      <ErpPageSection
        title="2. Add work entries"
        description="Build a draft list of one or more worker entries. Nothing is saved until you upload."
        actions={
          <Button
            size="sm"
            disabled={selectedLotIds.length === 0}
            onClick={() => setFormOpen(true)}
          >
            <Plus className="mr-2 size-4" />
            Add entries
          </Button>
        }
      >
        {draftEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {selectedLotIds.length === 0
              ? "Select at least one lot first."
              : "No draft entries yet. Click Add entries to start."}
          </p>
        ) : (
          <div className="space-y-2">
            {draftEntries.map((entry, index) => (
              <div
                key={entry.key}
                className="flex flex-col gap-2 rounded-xl border border-border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-0.5 text-sm">
                  <p className="font-medium text-foreground">
                    Entry {index + 1} · {entry.type === "PACKING" ? "Packing" : "Manufacturing"} ·{" "}
                    {formatDate(
                      entry.workDate instanceof Date
                        ? entry.workDate.toISOString()
                        : String(entry.workDate)
                    )}
                  </p>
                  <p className="text-muted-foreground">
                    Workers: {entry.workerNames.join(", ") || "—"}
                    {entry.machinery ? ` · Machinery: ${entry.machinery}` : ""}
                    {" · "}
                    {formatNumber(entry.hours)}h · M {entry.mistri} / HM {entry.halfMistri} / H{" "}
                    {entry.helper}
                    {entry.type === "PACKING" && entry.packQty != null
                      ? ` · Pack qty ${formatNumber(entry.packQty)}`
                      : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeDraft(entry.key)}
                  aria-label={`Remove draft entry ${index + 1}`}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ErpPageSection>

      <ErpPageSection
        title="3. Upload"
        description="Saves every draft entry onto each selected lot."
        actions={
          <Button size="sm" disabled={!canUpload} onClick={() => void handleUpload()}>
            <Upload className="mr-2 size-4" />
            {createBulk.isPending
              ? "Uploading…"
              : `Upload to ${selectedLotIds.length || 0} lot${selectedLotIds.length === 1 ? "" : "s"}`}
          </Button>
        }
      >
        <p className="text-sm text-muted-foreground">
          {draftEntries.length === 0 || selectedLotIds.length === 0
            ? "Select lots and add at least one draft entry to enable upload."
            : `Ready to copy ${draftEntries.length} entr${
                draftEntries.length === 1 ? "y" : "ies"
              } to ${selectedLotIds.length} lot${selectedLotIds.length === 1 ? "" : "s"}.`}
        </p>
      </ErpPageSection>

      <WorkerEntryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleAddToDraft}
        submitLabel="Add to draft"
      />
    </div>
  );
}
