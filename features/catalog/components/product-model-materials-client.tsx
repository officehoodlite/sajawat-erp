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

type Option = { id: string; label: string };

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
  const [hydrated, setHydrated] = useState(false);

  const [boardDialogOpen, setBoardDialogOpen] = useState(false);
  const [editingBoardKey, setEditingBoardKey] = useState<string | null>(null);

  const { data: thicknessOptions = [], isLoading: thicknessLoading } =
    useCatalogThicknessOptions(true);

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
        paintPresets: [],
        hardwarePresets: [],
        packingPresets: [],
        edgeBindingPresets: [],
        glassPresets: [],
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

  return (
    <ErpPage>
      <PageHeader
        title={model.modelName}
        description={`Default boards for ${product.name}. These sizes copy into a lot when the model is added.`}
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
          title="Default boards"
          description="Add the same board more than once with different sizes or quantities. Values copy into a lot when this model is added."
          actions={
            <CatalogMaterialsImportMenu
              thicknessOptions={thicknessOptions}
              onImportBoards={(rows) =>
                setBoardRows((current) => [
                  ...current,
                  ...rows.map((row) => ({ ...row, key: newKey() })),
                ])
              }
            />
          }
        >
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <CardTitle>Boards</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingBoardKey(null);
                  setBoardDialogOpen(true);
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
                            setBoardDialogOpen(true);
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

      {boardDialogOpen ? (
        <BoardPresetDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setBoardDialogOpen(false);
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
            setBoardDialogOpen(false);
            setEditingBoardKey(null);
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
