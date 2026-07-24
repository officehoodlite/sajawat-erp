"use client";

import { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { ErpPage, ErpPageSection } from "@/components/shared/erp-page";
import { PageHeader } from "@/components/shared/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCatalogProducts } from "@/features/catalog/hooks/use-catalog-products";
import { useLots } from "@/features/manufacturing/hooks/use-manufacturing";
import { SuggestibleField } from "@/features/production/components/suggestible-field";
import {
  useCreateProductionEntry,
  useDeleteProductionEntry,
  useProductionList,
  useProductionLotLookup,
  useProductionSuggestions,
  useUpdateProductionEntry,
} from "@/features/production/hooks/use-production";
import type { ProductionEntryDto, ProductionLotModelDto } from "@/types/dto";
import {
  PRODUCTION_STAGE_LABELS,
  PRODUCTION_STAGE_OPTIONS,
  type ProductionStage,
} from "@/types/enums";
import { formatNumber } from "@/utils/format";
import type {
  CreateProductionEntryInput,
  ProductionListQuery,
  UpdateProductionEntryInput,
} from "@/validators/production";

type FilterMode = "date" | "lot" | "model";

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function InlinePaintProgress({
  entry,
  onSave,
  isPending,
}: {
  entry: ProductionEntryDto;
  onSave: (values: {
    paintingReadyQty: number;
    paintingStatusQty: number;
  }) => Promise<unknown>;
  isPending: boolean;
}) {
  const [ready, setReady] = useState(entry.paintingReadyQty);
  const [status, setStatus] = useState(entry.paintingStatusQty);

  useEffect(() => {
    setReady(entry.paintingReadyQty);
    setStatus(entry.paintingStatusQty);
  }, [entry.paintingReadyQty, entry.paintingStatusQty]);

  const balance = Math.max(0, ready - status);

  const save = async () => {
    if (ready === entry.paintingReadyQty && status === entry.paintingStatusQty) return;
    if (ready < 0 || ready > entry.quantity) {
      toast.error(`Paint Ready must be between 0 and ${entry.quantity}`);
      setReady(entry.paintingReadyQty);
      setStatus(entry.paintingStatusQty);
      return;
    }
    if (status < 0 || status > ready) {
      toast.error("Paint Status cannot exceed Paint Ready");
      setReady(entry.paintingReadyQty);
      setStatus(entry.paintingStatusQty);
      return;
    }
    if (entry.completedReadyQty > status) {
      toast.error(`Paint Status cannot be below Done Ready (${entry.completedReadyQty})`);
      setReady(entry.paintingReadyQty);
      setStatus(entry.paintingStatusQty);
      return;
    }

    try {
      await onSave({ paintingReadyQty: ready, paintingStatusQty: status });
    } catch {
      setReady(entry.paintingReadyQty);
      setStatus(entry.paintingStatusQty);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }
    if (event.key === "Escape") {
      setReady(entry.paintingReadyQty);
      setStatus(entry.paintingStatusQty);
      event.currentTarget.blur();
    }
  };

  return (
    <div
      className="flex min-w-[190px] items-end gap-1"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <label className="space-y-1">
        <span className="block text-center text-[10px] text-muted-foreground">R</span>
        <Input
          type="number"
          min={0}
          max={entry.quantity}
          value={ready}
          disabled={isPending}
          onChange={(event) => setReady(Number(event.target.value) || 0)}
          onBlur={() => void save()}
          onKeyDown={handleKeyDown}
          className="h-8 w-14 px-2 text-center"
          aria-label="Paint Ready"
        />
      </label>
      <span className="pb-2 text-muted-foreground">/</span>
      <label className="space-y-1">
        <span className="block text-center text-[10px] text-muted-foreground">S</span>
        <Input
          type="number"
          min={0}
          max={ready}
          value={status}
          disabled={isPending}
          onChange={(event) => setStatus(Number(event.target.value) || 0)}
          onBlur={() => void save()}
          onKeyDown={handleKeyDown}
          className="h-8 w-14 px-2 text-center"
          aria-label="Paint Status"
        />
      </label>
      <span className="pb-2 text-muted-foreground">/</span>
      <label className="space-y-1">
        <span className="block text-center text-[10px] text-muted-foreground">B</span>
        <Input
          value={balance}
          readOnly
          tabIndex={-1}
          className="h-8 w-14 bg-muted/60 px-2 text-center"
          aria-label="Paint Balance"
        />
      </label>
    </div>
  );
}

function InlineDoneProgress({
  entry,
  onSave,
  isPending,
}: {
  entry: ProductionEntryDto;
  onSave: (values: {
    completedReadyQty: number;
    completedOutQty: number;
  }) => Promise<unknown>;
  isPending: boolean;
}) {
  const [ready, setReady] = useState(entry.completedReadyQty);
  const [out, setOut] = useState(entry.completedOutQty);

  useEffect(() => {
    setReady(entry.completedReadyQty);
    setOut(entry.completedOutQty);
  }, [entry.completedReadyQty, entry.completedOutQty]);

  const balance = Math.max(0, ready - out);

  const reset = () => {
    setReady(entry.completedReadyQty);
    setOut(entry.completedOutQty);
  };

  const save = async () => {
    if (ready === entry.completedReadyQty && out === entry.completedOutQty) return;
    if (ready < 0 || ready > entry.paintingStatusQty) {
      toast.error(`Done Ready must be between 0 and ${entry.paintingStatusQty}`);
      reset();
      return;
    }
    if (out < 0 || out > ready) {
      toast.error("Done Out cannot exceed Done Ready");
      reset();
      return;
    }

    try {
      await onSave({ completedReadyQty: ready, completedOutQty: out });
    } catch {
      reset();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }
    if (event.key === "Escape") {
      reset();
      event.currentTarget.blur();
    }
  };

  return (
    <div
      className="flex min-w-[190px] items-end gap-1"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <label className="space-y-1">
        <span className="block text-center text-[10px] text-muted-foreground">R</span>
        <Input
          type="number"
          min={0}
          max={entry.paintingStatusQty}
          value={ready}
          disabled={isPending}
          onChange={(event) => setReady(Number(event.target.value) || 0)}
          onBlur={() => void save()}
          onKeyDown={handleKeyDown}
          className="h-8 w-14 px-2 text-center"
          aria-label="Done Ready"
        />
      </label>
      <span className="pb-2 text-muted-foreground">/</span>
      <label className="space-y-1">
        <span className="block text-center text-[10px] text-muted-foreground">O</span>
        <Input
          type="number"
          min={0}
          max={ready}
          value={out}
          disabled={isPending}
          onChange={(event) => setOut(Number(event.target.value) || 0)}
          onBlur={() => void save()}
          onKeyDown={handleKeyDown}
          className="h-8 w-14 px-2 text-center"
          aria-label="Done Out"
        />
      </label>
      <span className="pb-2 text-muted-foreground">/</span>
      <label className="space-y-1">
        <span className="block text-center text-[10px] text-muted-foreground">B</span>
        <Input
          value={balance}
          readOnly
          tabIndex={-1}
          className="h-8 w-14 bg-muted/60 px-2 text-center"
          aria-label="Done Balance"
        />
      </label>
    </div>
  );
}

export function ProductionPageClient() {
  const [filterMode, setFilterMode] = useState<FilterMode>("date");
  const [filterDate, setFilterDate] = useState(todayInput);
  const [lotSearch, setLotSearch] = useState("");
  const [selectedLotId, setSelectedLotId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedCatalogModelId, setSelectedCatalogModelId] = useState("");

  const { data: lotsPage } = useLots(1, 50, lotSearch);
  const { data: catalogProducts = [] } = useCatalogProducts();

  const catalogModels = useMemo(() => {
    const product = catalogProducts.find((p) => p.id === selectedProductId);
    return product?.models ?? [];
  }, [catalogProducts, selectedProductId]);

  const listFilter: ProductionListQuery | null = useMemo(() => {
    if (filterMode === "date") {
      return /^\d{4}-\d{2}-\d{2}$/.test(filterDate)
        ? { mode: "date", date: filterDate }
        : null;
    }
    if (filterMode === "lot") {
      return selectedLotId ? { mode: "lot", lotId: selectedLotId } : null;
    }
    return selectedCatalogModelId
      ? { mode: "model", catalogModelId: selectedCatalogModelId }
      : null;
  }, [filterMode, filterDate, selectedLotId, selectedCatalogModelId]);

  const { data, isFetching, isError, error } = useProductionList(listFilter);
  const entries = data?.entries ?? [];
  const { data: suggestions } = useProductionSuggestions();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductionEntryDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductionEntryDto | null>(null);

  const createEntry = useCreateProductionEntry();
  const updateEntry = useUpdateProductionEntry();
  const deleteEntry = useDeleteProductionEntry();

  const showDateColumn = filterMode !== "date";

  const columns: ColumnDef<ProductionEntryDto>[] = [
    ...(showDateColumn
      ? [
          {
            accessorKey: "workDate",
            header: "Date",
          } satisfies ColumnDef<ProductionEntryDto>,
        ]
      : []),
    {
      accessorKey: "lotNumber",
      header: "Lot",
      cell: ({ row }) => <span className="font-medium">{row.original.lotNumber}</span>,
    },
    {
      id: "model",
      header: "Model",
      cell: ({ row }) => (
        <span>
          {row.original.productName} — {row.original.modelName}
        </span>
      ),
    },
    {
      accessorKey: "parts",
      header: "Parts",
      cell: ({ row }) => row.original.parts.join(", "),
    },
    { accessorKey: "details", header: "Details" },
    {
      id: "quantity",
      header: "Initial",
      cell: ({ row }) => formatNumber(row.original.quantity),
    },
    {
      id: "carpentry",
      header: "Carpentry",
      cell: ({ row }) => formatNumber(row.original.carpentryQty),
    },
    {
      id: "paint",
      header: "Paint R/S/B",
      cell: ({ row }) => (
        <InlinePaintProgress
          entry={row.original}
          isPending={updateEntry.isPending}
          onSave={(values) =>
            updateEntry.mutateAsync({
              id: row.original.id,
              ...values,
            })
          }
        />
      ),
    },
    {
      id: "done",
      header: "Done R/O/B",
      cell: ({ row }) => (
        <InlineDoneProgress
          entry={row.original}
          isPending={updateEntry.isPending}
          onSave={(values) =>
            updateEntry.mutateAsync({
              id: row.original.id,
              ...values,
            })
          }
        />
      ),
    },
    {
      accessorKey: "statusText",
      header: "Status",
      cell: ({ row }) => row.original.statusText ?? "—",
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => row.original.description ?? "—",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation();
            setDeleteTarget(row.original);
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  const emptyTitle =
    filterMode === "date"
      ? "No active entries for this date"
      : filterMode === "lot"
        ? selectedLotId
          ? "No active entries for this lot"
          : "Select a lot"
        : selectedCatalogModelId
          ? "No active entries for this model"
          : "Select a model";

  return (
    <ErpPage>
      <PageHeader
        title="Production"
        description="Track production progress by date, lot, or catalog model. Completed lines hide when Done Out reaches Initial Qty."
      >
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New entry
        </Button>
      </PageHeader>

      <ErpPageSection title="Production entries">
        <div className="mb-4 grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label required>Filter</Label>
            <Select
              value={filterMode}
              onValueChange={(v) => setFilterMode((v as FilterMode) ?? "date")}
              items={[
                { value: "date", label: "Date" },
                { value: "lot", label: "LOT wise" },
                { value: "model", label: "Model wise" },
              ]}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="lot">LOT wise</SelectItem>
                <SelectItem value="model">Model wise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filterMode === "date" ? (
            <div className="space-y-2">
              <Label htmlFor="filterDate" required>
                Date
              </Label>
              <Input
                id="filterDate"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full"
              />
            </div>
          ) : null}

          {filterMode === "lot" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="lotSearch">Search lot</Label>
                <Input
                  id="lotSearch"
                  value={lotSearch}
                  onChange={(e) => setLotSearch(e.target.value)}
                  placeholder="Lot number"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label required>Lot</Label>
                <Select
                  value={selectedLotId || null}
                  onValueChange={(v) => setSelectedLotId(v ?? "")}
                  items={(lotsPage?.items ?? []).map((lot) => ({
                    value: lot.id,
                    label: lot.lotNumber,
                  }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select lot" />
                  </SelectTrigger>
                  <SelectContent>
                    {(lotsPage?.items ?? []).map((lot) => (
                      <SelectItem key={lot.id} value={lot.id}>
                        {lot.lotNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : null}

          {filterMode === "model" ? (
            <>
              <div className="space-y-2">
                <Label required>Product</Label>
                <Select
                  value={selectedProductId || null}
                  onValueChange={(v) => {
                    setSelectedProductId(v ?? "");
                    setSelectedCatalogModelId("");
                  }}
                  items={catalogProducts.map((p) => ({
                    value: p.id,
                    label: p.name,
                  }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogProducts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label required>Model</Label>
                <Select
                  value={selectedCatalogModelId || null}
                  onValueChange={(v) => setSelectedCatalogModelId(v ?? "")}
                  items={catalogModels.map((m) => ({
                    value: m.id,
                    label: m.modelName,
                  }))}
                  disabled={!selectedProductId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={selectedProductId ? "Select model" : "Select product first"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogModels.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.modelName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : null}

          {isFetching ? (
            <p className="self-center text-sm text-muted-foreground">Loading…</p>
          ) : null}
          {isError ? (
            <p className="self-center text-sm text-destructive">{(error as Error).message}</p>
          ) : null}
        </div>

        <DataTable
          columns={columns}
          data={entries}
          emptyTitle={emptyTitle}
          emptyDescription="Create a production entry, or adjust the filter."
          onRowClick={(row) => {
            setEditing(row);
            setFormOpen(true);
          }}
        />
      </ErpPageSection>

      {formOpen && (
        <ProductionEntryDialog
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditing(null);
          }}
          entry={editing}
          defaultWorkDate={filterMode === "date" ? filterDate : todayInput()}
          detailSuggestions={suggestions?.details ?? []}
          statusSuggestions={suggestions?.statuses ?? []}
          onCreate={async (payload) => {
            await createEntry.mutateAsync(payload);
            setFormOpen(false);
            if (filterMode === "date" && payload.workDate !== filterDate) {
              setFilterDate(payload.workDate);
            }
          }}
          onUpdate={async (id, payload) => {
            const updated = await updateEntry.mutateAsync({ id, ...payload });
            setFormOpen(false);
            setEditing(null);
            if (filterMode === "date" && updated.workDate !== filterDate) {
              setFilterDate(updated.workDate);
            }
          }}
          isPending={createEntry.isPending || updateEntry.isPending}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the production entry permanently. Capacity for the selected parts will
              be freed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteTarget) return;
                void deleteEntry.mutateAsync(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ErpPage>
  );
}

interface ProductionEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: ProductionEntryDto | null;
  defaultWorkDate: string;
  detailSuggestions: string[];
  statusSuggestions: string[];
  onCreate: (payload: CreateProductionEntryInput) => Promise<void>;
  onUpdate: (id: string, payload: UpdateProductionEntryInput) => Promise<void>;
  isPending?: boolean;
}

function ProductionEntryDialog({
  open,
  onOpenChange,
  entry,
  defaultWorkDate,
  detailSuggestions,
  statusSuggestions,
  onCreate,
  onUpdate,
  isPending,
}: ProductionEntryDialogProps) {
  const [workDate, setWorkDate] = useState(entry?.workDate ?? defaultWorkDate);
  const [lotNumber, setLotNumber] = useState(entry?.lotNumber ?? "");
  const [activeLotNumber, setActiveLotNumber] = useState(entry?.lotNumber ?? "");
  const [modelId, setModelId] = useState(entry?.manufacturingModelId ?? "");
  const [parts, setParts] = useState<string[]>(entry?.parts ?? []);
  const [details, setDetails] = useState(entry?.details ?? "");
  const [statusText, setStatusText] = useState(entry?.statusText ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [stage, setStage] = useState<ProductionStage>(entry?.stage ?? "CARPENTRY");
  const [initialQty, setInitialQty] = useState(entry?.quantity ?? 1);

  const { data: lotLookup, isFetching: lotLoading } = useProductionLotLookup(
    activeLotNumber,
    open && activeLotNumber.trim().length > 0
  );

  const lot = lotLookup?.lot ?? null;
  const models: ProductionLotModelDto[] = lotLookup?.models ?? [];

  const selectedModel = useMemo(
    () => models.find((m) => m.id === modelId) ?? null,
    [models, modelId]
  );

  const remainingByPart = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of selectedModel?.remainingCapacityByPart ?? []) {
      const bonus =
        entry && entry.parts.includes(row.part) && entry.manufacturingModelId === modelId
          ? entry.quantity
          : 0;
      map.set(row.part, row.remaining + bonus);
    }
    return map;
  }, [selectedModel, entry, modelId]);

  const maxForSelectedParts = useMemo(() => {
    if (!selectedModel || parts.length === 0) return selectedModel?.quantity ?? 0;
    return Math.min(...parts.map((p) => remainingByPart.get(p) ?? 0));
  }, [selectedModel, parts, remainingByPart]);

  useEffect(() => {
    if (!open) return;
    setWorkDate(entry?.workDate ?? defaultWorkDate);
    setLotNumber(entry?.lotNumber ?? "");
    setActiveLotNumber(entry?.lotNumber ?? "");
    setModelId(entry?.manufacturingModelId ?? "");
    setParts(entry?.parts ?? []);
    setDetails(entry?.details ?? "");
    setStatusText(entry?.statusText ?? "");
    setDescription(entry?.description ?? "");
    setStage(entry?.stage ?? "CARPENTRY");
    setInitialQty(entry?.quantity ?? 1);
  }, [open, entry, defaultWorkDate]);

  useEffect(() => {
    if (entry) return;
    setModelId("");
    setParts([]);
  }, [activeLotNumber, entry]);

  useEffect(() => {
    if (entry) return;
    setParts([]);
  }, [modelId, entry]);

  const togglePart = (part: string) => {
    setParts((prev) => (prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part]));
  };

  const loadLot = () => setActiveLotNumber(lotNumber.trim());

  const initialQtyValid =
    initialQty >= 1 &&
    (!entry || initialQty >= entry.paintingReadyQty) &&
    initialQty <= maxForSelectedParts;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelId || !details.trim() || parts.length === 0 || !workDate || !initialQtyValid) return;

    if (entry) {
      await onUpdate(entry.id, {
        parts,
        details: details.trim(),
        statusText: statusText.trim() || null,
        description: description.trim() || null,
        workDate,
        stage,
        carpentryQty: initialQty,
      });
      return;
    }

    if (!lot) return;
    await onCreate({
      lotId: lot.id,
      manufacturingModelId: modelId,
      parts,
      details: details.trim(),
      statusText: statusText.trim() || undefined,
      description: description.trim() || undefined,
      workDate,
      stage,
      carpentryQty: initialQty,
      paintingReadyQty: 0,
      paintingStatusQty: 0,
      completedReadyQty: 0,
      completedOutQty: 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{entry ? "Edit production entry" : "New production entry"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workDate" required>
              Date
            </Label>
            <Input
              id="workDate"
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entryLotNumber" required>
              Lot number
            </Label>
            <div className="flex gap-2">
              <Input
                id="entryLotNumber"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                placeholder="e.g. 1426"
                disabled={!!entry}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    loadLot();
                  }
                }}
              />
              {!entry && (
                <Button type="button" variant="outline" onClick={loadLot}>
                  Load
                </Button>
              )}
            </div>
            {lotLoading ? (
              <p className="text-xs text-muted-foreground">Loading lot…</p>
            ) : null}
            {activeLotNumber && !lotLoading && !lot ? (
              <p className="text-xs text-destructive">Lot not found.</p>
            ) : null}
            {lot && models.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                This lot has no models. Add models in Manufacturing first.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label required>Model</Label>
            <Select
              value={modelId || null}
              onValueChange={(v) => setModelId(v ?? "")}
              items={models.map((m) => ({
                value: m.id,
                label: `${m.productName} — ${m.modelName}`,
              }))}
              disabled={!!entry || !lot || models.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={lot ? "Select model" : "Load a lot first"}
                />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.productName} — {m.modelName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedModel && (
            <div className="space-y-2">
              <Label required>Parts</Label>
              <div className="flex flex-wrap gap-3 rounded-xl border border-border p-3">
                {selectedModel.partOptions.map((part) => {
                  const rem = remainingByPart.get(part) ?? 0;
                  return (
                    <label key={part} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={parts.includes(part)}
                        onCheckedChange={() => togglePart(part)}
                        disabled={rem <= 0 && !parts.includes(part)}
                      />
                      <span>
                        {part}{" "}
                        <span className="text-muted-foreground">(rem. {rem})</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Selected parts share the same quantities. Each part has its own remaining
                capacity up to the model quantity.
              </p>
            </div>
          )}

          <SuggestibleField
            id="details"
            label="Details"
            required
            value={details}
            onChange={setDetails}
            suggestions={detailSuggestions}
            placeholder="e.g. BODY ONLY"
          />

          <SuggestibleField
            id="statusText"
            label="Status"
            value={statusText}
            onChange={setStatusText}
            suggestions={statusSuggestions}
            placeholder="Overall model status"
          />

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2">
            <Label required>Stage</Label>
            <Select
              value={stage}
              onValueChange={(v) => setStage((v as ProductionStage) ?? "CARPENTRY")}
              items={PRODUCTION_STAGE_OPTIONS.map((s) => ({
                value: s,
                label: PRODUCTION_STAGE_LABELS[s],
              }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCTION_STAGE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {PRODUCTION_STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Changing stage does not change quantities.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialQty" required>
              Initial Qty{selectedModel && parts.length > 0 ? ` (max ${maxForSelectedParts})` : ""}
            </Label>
            <Input
              id="initialQty"
              type="number"
              min={1}
              max={maxForSelectedParts || undefined}
              value={initialQty}
              onChange={(e) => setInitialQty(Number(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Paint and Done progress is entered directly in the production table.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isPending ||
                !workDate ||
                !modelId ||
                !details.trim() ||
                parts.length === 0 ||
                !initialQtyValid ||
                (!entry && !lot)
              }
            >
              {isPending ? "Saving…" : entry ? "Save changes" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
