"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { CatalogMaterialsImportMenu } from "@/features/catalog/components/catalog-materials-import-menu";
import { ErpPage, ErpPageSection } from "@/components/shared/erp-page";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  useCatalogMaterialOptions,
  useCatalogProduct,
  useCatalogThicknessOptions,
  useUpdateCatalogProductModel,
} from "@/features/catalog/hooks/use-catalog-products";
import { DECIMAL_INPUT_STEP } from "@/lib/decimal";
import { formatCatalogModelName, parseCatalogModelName } from "@/lib/model-name";
import { calcBoardEntrySqft } from "@/utils/board-calculations";
import { formatSqft } from "@/utils/format";

interface ProductModelMaterialsClientProps {
  productId: string;
  modelId: string;
}

type BoardRow = {
  key: string;
  boardThicknessId: string;
  label: string;
  length: number;
  width: number;
  quantity: number;
};

type QtyRow = {
  key: string;
  productId: string;
  label: string;
  quantity: number;
};

type Option = { id: string; label: string };

type DialogKind = "boards" | "paint" | "hardware" | "packing" | "edgebinding" | "glass";

const QTY_TITLES: Record<Exclude<DialogKind, "boards">, string> = {
  paint: "Paint",
  hardware: "Hardware",
  packing: "Packing",
  edgebinding: "Edge Binding",
  glass: "Glass",
};

function newKey() {
  return crypto.randomUUID();
}

function numOrEmpty(value: number) {
  return Number.isFinite(value) && value !== 0 ? value : "";
}

export function ProductModelMaterialsClient({
  productId,
  modelId,
}: ProductModelMaterialsClientProps) {
  const router = useRouter();
  const { data: product, isLoading } = useCatalogProduct(productId);
  const updateModel = useUpdateCatalogProductModel(productId);

  const model = product?.models.find((m) => m.id === modelId) ?? null;

  const [modelNumber, setModelNumber] = useState("");
  const [modelSize, setModelSize] = useState("");
  const [partCount, setPartCount] = useState(1);
  const [boardRows, setBoardRows] = useState<BoardRow[]>([]);
  const [paintRows, setPaintRows] = useState<QtyRow[]>([]);
  const [hardwareRows, setHardwareRows] = useState<QtyRow[]>([]);
  const [packingRows, setPackingRows] = useState<QtyRow[]>([]);
  const [edgeBindingRows, setEdgeBindingRows] = useState<QtyRow[]>([]);
  const [glassRows, setGlassRows] = useState<QtyRow[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const [dialogKind, setDialogKind] = useState<DialogKind | null>(null);
  const [editingBoardKey, setEditingBoardKey] = useState<string | null>(null);
  const [editingQtyKey, setEditingQtyKey] = useState<string | null>(null);

  const { data: thicknessOptions = [], isLoading: thicknessLoading } =
    useCatalogThicknessOptions(true);
  const { data: paintOptions = [], isLoading: paintLoading } = useCatalogMaterialOptions(
    "paint",
    true
  );
  const { data: hardwareOptions = [], isLoading: hardwareLoading } = useCatalogMaterialOptions(
    "hardware",
    true
  );
  const { data: packingOptions = [], isLoading: packingLoading } = useCatalogMaterialOptions(
    "packing",
    true
  );
  const { data: edgeBindingOptions = [], isLoading: edgeBindingLoading } =
    useCatalogMaterialOptions("edgebinding", true);
  const { data: glassOptions = [], isLoading: glassLoading } = useCatalogMaterialOptions(
    "glass",
    true
  );

  useEffect(() => {
    if (!model || hydrated) return;
    const parsed = parseCatalogModelName(model.modelName);
    setModelNumber(parsed.modelNumber);
    setModelSize(parsed.size);
    setPartCount(model.partCount);
    setBoardRows(
      model.boardPresets.map((p) => ({
        key: p.id,
        boardThicknessId: p.boardThicknessId,
        label: p.label,
        length: p.length,
        width: p.width,
        quantity: p.quantity,
      }))
    );
    setPaintRows(
      model.paintPresets.map((p) => ({
        key: p.id,
        productId: p.productId,
        label: p.label,
        quantity: p.quantity,
      }))
    );
    setHardwareRows(
      model.hardwarePresets.map((p) => ({
        key: p.id,
        productId: p.productId,
        label: p.label,
        quantity: p.quantity,
      }))
    );
    setPackingRows(
      model.packingPresets.map((p) => ({
        key: p.id,
        productId: p.productId,
        label: p.label,
        quantity: p.quantity,
      }))
    );
    setEdgeBindingRows(
      model.edgeBindingPresets.map((p) => ({
        key: p.id,
        productId: p.productId,
        label: p.label,
        quantity: p.quantity,
      }))
    );
    setGlassRows(
      model.glassPresets.map((p) => ({
        key: p.id,
        productId: p.productId,
        label: p.label,
        quantity: p.quantity,
      }))
    );
    setHydrated(true);
  }, [model, hydrated]);

  const backHref = `/products?productId=${encodeURIComponent(productId)}`;

  const modelPreview =
    modelNumber.trim() && modelSize.trim()
      ? formatCatalogModelName(modelNumber, modelSize)
      : "";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelNumber.trim() || !modelSize.trim() || partCount < 1 || partCount > 26) return;
    try {
      await updateModel.mutateAsync({
        modelId,
        modelNumber: modelNumber.trim(),
        size: modelSize.trim(),
        partCount,
        boardPresets: boardRows.map((row) => ({
          boardThicknessId: row.boardThicknessId,
          length: row.length,
          width: row.width,
          quantity: row.quantity,
        })),
        paintPresets: paintRows.map((row) => ({
          productId: row.productId,
          quantity: row.quantity,
        })),
        hardwarePresets: hardwareRows.map((row) => ({
          productId: row.productId,
          quantity: row.quantity,
        })),
        packingPresets: packingRows.map((row) => ({
          productId: row.productId,
          quantity: row.quantity,
        })),
        edgeBindingPresets: edgeBindingRows.map((row) => ({
          productId: row.productId,
          quantity: row.quantity,
        })),
        glassPresets: glassRows.map((row) => ({
          productId: row.productId,
          quantity: row.quantity,
        })),
      });
      router.push(backHref);
    } catch {
      // Toast shown by mutation onError
    }
  };

  if (isLoading) {
    return (
      <ErpPage>
        <PageHeader title="Model materials" description="Loading…" />
      </ErpPage>
    );
  }

  if (!product || !model) {
    return (
      <ErpPage>
        <PageHeader
          title="Model not found"
          description="This product model could not be loaded."
        >
          <Button variant="outline" onClick={() => router.push("/products")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Products
          </Button>
        </PageHeader>
      </ErpPage>
    );
  }

  const qtyCard = (
    title: string,
    rows: QtyRow[],
    setRows: (rows: QtyRow[]) => void,
    kind: Exclude<DialogKind, "boards">,
    loading: boolean
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <CardTitle>{title}</CardTitle>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setEditingQtyKey(null);
            setDialogKind(kind);
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items yet.</p>
        ) : (
          rows.map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{row.label}</p>
                <p className="text-xs text-muted-foreground">Qty {row.quantity}</p>
              </div>
              <div className="flex shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setEditingQtyKey(row.key);
                    setDialogKind(kind);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setRows(rows.filter((r) => r.key !== row.key))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  return (
    <ErpPage>
      <PageHeader
        title={model.modelName}
        description={`Default materials for ${product.name}. These items and quantities are pre-filled when the model is added to a lot.`}
      >
        <Button variant="outline" onClick={() => router.push(backHref)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </PageHeader>

      <form onSubmit={handleSave} className="space-y-6">
        <ErpPageSection title="Model details">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="modelNumber" required>
                Model Number
              </Label>
              <Input
                id="modelNumber"
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
                placeholder="e.g. 418"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelSize" required>
                Size
              </Label>
              <Input
                id="modelSize"
                value={modelSize}
                onChange={(e) => setModelSize(e.target.value)}
                placeholder="e.g. 78 x 60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partCount" required>
                Number of parts
              </Label>
              <Input
                id="partCount"
                type="number"
                min={1}
                max={26}
                value={partCount}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setPartCount(Number.isFinite(n) ? n : 1);
                }}
              />
            </div>
          </div>
          {modelPreview ? (
            <p className="mt-4 rounded-lg bg-muted/60 px-3 py-2 text-[13px] text-muted-foreground">
              Will appear as{" "}
              <span className="font-medium text-foreground">{modelPreview}</span>
            </p>
          ) : null}
        </ErpPageSection>

        <ErpPageSection
          title="Default materials"
          description="Add the same material more than once with different sizes or quantities. Values copy into a lot when this model is added."
          actions={
            <CatalogMaterialsImportMenu
              thicknessOptions={thicknessOptions}
              paintOptions={paintOptions}
              hardwareOptions={hardwareOptions}
              packingOptions={packingOptions}
              edgeBindingOptions={edgeBindingOptions}
              glassOptions={glassOptions}
              onImportBoards={(rows) =>
                setBoardRows((current) => [
                  ...current,
                  ...rows.map((row) => ({ ...row, key: newKey() })),
                ])
              }
              onImportQty={(kind, rows) => {
                const next = rows.map((row) => ({ ...row, key: newKey() }));
                if (kind === "paint") setPaintRows((current) => [...current, ...next]);
                if (kind === "hardware") setHardwareRows((current) => [...current, ...next]);
                if (kind === "packing") setPackingRows((current) => [...current, ...next]);
                if (kind === "edgebinding") setEdgeBindingRows((current) => [...current, ...next]);
                if (kind === "glass") setGlassRows((current) => [...current, ...next]);
              }}
            />
          }
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <CardTitle>Boards</CardTitle>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingBoardKey(null);
                    setDialogKind("boards");
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {thicknessLoading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : boardRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No boards yet.</p>
                ) : (
                  boardRows.map((row) => {
                    const sqft =
                      row.length > 0 && row.width > 0 && row.quantity > 0
                        ? calcBoardEntrySqft(row.length, row.width, row.quantity).totalSqft
                        : null;
                    return (
                      <div
                        key={row.key}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{row.label}</p>
                          <p className="text-xs text-muted-foreground">
                            L {row.length} · W {row.width} · Qty {row.quantity}
                            {sqft != null ? ` · ${formatSqft(sqft)}` : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setEditingBoardKey(row.key);
                              setDialogKind("boards");
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              setBoardRows(boardRows.filter((r) => r.key !== row.key))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
            {qtyCard("Paint", paintRows, setPaintRows, "paint", paintLoading)}
            {qtyCard("Hardware", hardwareRows, setHardwareRows, "hardware", hardwareLoading)}
            {qtyCard("Packing", packingRows, setPackingRows, "packing", packingLoading)}
            {qtyCard(
              "Edge Binding",
              edgeBindingRows,
              setEdgeBindingRows,
              "edgebinding",
              edgeBindingLoading
            )}
            {qtyCard("Glass", glassRows, setGlassRows, "glass", glassLoading)}
          </div>
        </ErpPageSection>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push(backHref)}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              updateModel.isPending ||
              !modelNumber.trim() ||
              !modelSize.trim() ||
              partCount < 1 ||
              partCount > 26
            }
          >
            {updateModel.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>

      {dialogKind === "boards" ? (
        <BoardPresetDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setDialogKind(null);
              setEditingBoardKey(null);
            }
          }}
          options={thicknessOptions}
          existing={
            editingBoardKey ? boardRows.find((r) => r.key === editingBoardKey) ?? null : null
          }
          onSave={(rows) => {
            if (editingBoardKey) {
              const next = rows[0];
              if (!next) return;
              setBoardRows(
                boardRows.map((r) => (r.key === editingBoardKey ? { ...next, key: r.key } : r))
              );
            } else {
              setBoardRows([...boardRows, ...rows]);
            }
            setDialogKind(null);
            setEditingBoardKey(null);
          }}
        />
      ) : null}

      {dialogKind && dialogKind !== "boards" ? (
        <QtyPresetDialog
          open
          title={QTY_TITLES[dialogKind]}
          options={
            dialogKind === "paint"
              ? paintOptions
              : dialogKind === "hardware"
                ? hardwareOptions
                : dialogKind === "packing"
                  ? packingOptions
                  : dialogKind === "edgebinding"
                    ? edgeBindingOptions
                    : glassOptions
          }
          existing={
            editingQtyKey
              ? (dialogKind === "paint"
                  ? paintRows
                  : dialogKind === "hardware"
                    ? hardwareRows
                    : dialogKind === "packing"
                      ? packingRows
                      : dialogKind === "edgebinding"
                        ? edgeBindingRows
                        : glassRows
                ).find((r) => r.key === editingQtyKey) ?? null
              : null
          }
          onOpenChange={(open) => {
            if (!open) {
              setDialogKind(null);
              setEditingQtyKey(null);
            }
          }}
          onSave={(rows) => {
            const apply = (current: QtyRow[]) => {
              if (editingQtyKey) {
                const next = rows[0];
                if (!next) return current;
                return current.map((r) =>
                  r.key === editingQtyKey ? { ...next, key: r.key } : r
                );
              }
              return [...current, ...rows];
            };
            if (dialogKind === "paint") setPaintRows(apply(paintRows));
            if (dialogKind === "hardware") setHardwareRows(apply(hardwareRows));
            if (dialogKind === "packing") setPackingRows(apply(packingRows));
            if (dialogKind === "edgebinding") setEdgeBindingRows(apply(edgeBindingRows));
            if (dialogKind === "glass") setGlassRows(apply(glassRows));
            setDialogKind(null);
            setEditingQtyKey(null);
          }}
        />
      ) : null}
    </ErpPage>
  );
}

function BoardPresetDialog({
  open,
  onOpenChange,
  options,
  existing,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: Option[];
  existing: BoardRow | null;
  onSave: (rows: BoardRow[]) => void;
}) {
  const [materialId, setMaterialId] = useState(existing?.boardThicknessId ?? "");
  const [sizes, setSizes] = useState(
    existing
      ? [{ length: existing.length, width: existing.width, quantity: existing.quantity }]
      : [{ length: 0, width: 0, quantity: 0 }]
  );

  const label = options.find((o) => o.id === materialId)?.label ?? existing?.label ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit board" : "Add boards"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label required>Material + thickness</Label>
            <Select
              value={materialId || null}
              onValueChange={(v) => setMaterialId(v ?? "")}
              items={options.map((o) => ({ value: o.id, label: o.label }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select board" />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            {sizes.map((size, index) => {
              const sqft =
                size.length > 0 && size.width > 0 && size.quantity > 0
                  ? calcBoardEntrySqft(size.length, size.width, size.quantity).totalSqft
                  : null;
              return (
                <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto_auto] items-end gap-2">
                  <div className="space-y-1">
                    {index === 0 ? <Label>L</Label> : null}
                    <Input
                      type="number"
                      min={0}
                      step={DECIMAL_INPUT_STEP}
                      value={numOrEmpty(size.length)}
                      onChange={(e) =>
                        setSizes(
                          sizes.map((s, i) =>
                            i === index ? { ...s, length: Number(e.target.value) || 0 } : s
                          )
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    {index === 0 ? <Label>W</Label> : null}
                    <Input
                      type="number"
                      min={0}
                      step={DECIMAL_INPUT_STEP}
                      value={numOrEmpty(size.width)}
                      onChange={(e) =>
                        setSizes(
                          sizes.map((s, i) =>
                            i === index ? { ...s, width: Number(e.target.value) || 0 } : s
                          )
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    {index === 0 ? <Label>Qty</Label> : null}
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={numOrEmpty(size.quantity)}
                      onChange={(e) =>
                        setSizes(
                          sizes.map((s, i) =>
                            i === index ? { ...s, quantity: Number(e.target.value) || 0 } : s
                          )
                        )
                      }
                    />
                  </div>
                  <p className="mb-2 w-16 text-xs text-muted-foreground">
                    {sqft != null ? formatSqft(sqft) : "sqft"}
                  </p>
                  {!existing && sizes.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="mb-1"
                      onClick={() => setSizes(sizes.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <span className="mb-1 w-8" />
                  )}
                </div>
              );
            })}
            {!existing ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSizes([...sizes, { length: 0, width: 0, quantity: 0 }])}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add size
              </Button>
            ) : null}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!materialId}
              onClick={() =>
                onSave(
                  sizes.map((size) => ({
                    key: newKey(),
                    boardThicknessId: materialId,
                    label,
                    length: size.length,
                    width: size.width,
                    quantity: size.quantity,
                  }))
                )
              }
            >
              {existing ? "Save" : "Add"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function QtyPresetDialog({
  open,
  title,
  options,
  existing,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  title: string;
  options: Option[];
  existing: QtyRow | null;
  onOpenChange: (open: boolean) => void;
  onSave: (rows: QtyRow[]) => void;
}) {
  const [productId, setProductId] = useState(existing?.productId ?? "");
  const [quantities, setQuantities] = useState(
    existing ? [existing.quantity] : [0]
  );
  const label = options.find((o) => o.id === productId)?.label ?? existing?.label ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existing ? `Edit ${title.toLowerCase()}` : `Add ${title.toLowerCase()}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label required>Product</Label>
            <Select
              value={productId || null}
              onValueChange={(v) => setProductId(v ?? "")}
              items={options.map((o) => ({ value: o.id, label: o.label }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            {quantities.map((qty, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  {index === 0 ? <Label>Qty</Label> : null}
                  <Input
                    type="number"
                    min={0}
                    step={DECIMAL_INPUT_STEP}
                    value={numOrEmpty(qty)}
                    onChange={(e) =>
                      setQuantities(
                        quantities.map((q, i) => (i === index ? Number(e.target.value) || 0 : q))
                      )
                    }
                  />
                </div>
                {!existing && quantities.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="mb-1"
                    onClick={() => setQuantities(quantities.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            ))}
            {!existing ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuantities([...quantities, 0])}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add quantity
              </Button>
            ) : null}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!productId}
              onClick={() =>
                onSave(
                  quantities.map((quantity) => ({
                    key: newKey(),
                    productId,
                    label,
                    quantity,
                  }))
                )
              }
            >
              {existing ? "Save" : "Add"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
