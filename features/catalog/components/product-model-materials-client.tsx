"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ErpPage, ErpPageSection } from "@/components/shared/erp-page";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModelPresetMultiSelect } from "@/features/catalog/components/model-preset-multi-select";
import {
  useCatalogMaterialOptions,
  useCatalogProduct,
  useCatalogThicknessOptions,
  useUpdateCatalogProductModel,
} from "@/features/catalog/hooks/use-catalog-products";
import { formatCatalogModelName, parseCatalogModelName } from "@/lib/model-name";

interface ProductModelMaterialsClientProps {
  productId: string;
  modelId: string;
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
  const [boardThicknessIds, setBoardThicknessIds] = useState<string[]>([]);
  const [paintProductIds, setPaintProductIds] = useState<string[]>([]);
  const [hardwareProductIds, setHardwareProductIds] = useState<string[]>([]);
  const [packingProductIds, setPackingProductIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

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

  useEffect(() => {
    if (!model || hydrated) return;
    const parsed = parseCatalogModelName(model.modelName);
    setModelNumber(parsed.modelNumber);
    setModelSize(parsed.size);
    setPartCount(model.partCount);
    setBoardThicknessIds(model.boardPresets.map((p) => p.id));
    setPaintProductIds(model.paintPresets.map((p) => p.id));
    setHardwareProductIds(model.hardwarePresets.map((p) => p.id));
    setPackingProductIds(model.packingPresets.map((p) => p.id));
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
        boardThicknessIds,
        paintProductIds,
        hardwareProductIds,
        packingProductIds,
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
        description={`Default materials for ${product.name}. These items are pre-filled when the model is added to a lot.`}
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
          description="Select boards, paint, hardware, and packing used by this model. Quantities are entered later in the lot."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <ModelPresetMultiSelect
              label="Boards (material + thickness)"
              options={thicknessOptions}
              selectedIds={boardThicknessIds}
              onChange={setBoardThicknessIds}
              isLoading={thicknessLoading}
              emptyText="No board thicknesses yet"
              listClassName="max-h-64"
            />
            <ModelPresetMultiSelect
              label="Paint"
              options={paintOptions}
              selectedIds={paintProductIds}
              onChange={setPaintProductIds}
              isLoading={paintLoading}
              emptyText="No paint products yet"
              listClassName="max-h-64"
            />
            <ModelPresetMultiSelect
              label="Hardware"
              options={hardwareOptions}
              selectedIds={hardwareProductIds}
              onChange={setHardwareProductIds}
              isLoading={hardwareLoading}
              emptyText="No hardware products yet"
              listClassName="max-h-64"
            />
            <ModelPresetMultiSelect
              label="Packing"
              options={packingOptions}
              selectedIds={packingProductIds}
              onChange={setPackingProductIds}
              isLoading={packingLoading}
              emptyText="No packing products yet"
              listClassName="max-h-64"
            />
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
    </ErpPage>
  );
}
