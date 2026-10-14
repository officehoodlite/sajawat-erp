"use client";

import { useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import { ErpPage, ErpPageSection } from "@/components/shared/erp-page";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCatalogProductPicker } from "@/features/catalog/hooks/use-catalog-products";
import { useProductSummary } from "@/features/manufacturing/hooks/use-product-summary";
import { downloadCsv } from "@/lib/csv-download";
import type { ModelLotMaterialLineDto, ProductSummaryRowDto } from "@/types/dto";
import { round2 } from "@/utils/board-calculations";
import { formatNumber } from "@/utils/format";

function perUnitTotal(lines: ModelLotMaterialLineDto[], quantity: number) {
  if (lines.length === 0 || quantity <= 0) return null;
  const total = lines.reduce((sum, line) => sum + line.total, 0);
  return round2(total / quantity);
}

function formatPerUnit(lines: ModelLotMaterialLineDto[], quantity: number, unit?: string) {
  const value = perUnitTotal(lines, quantity);
  if (value == null) return "—";
  const resolvedUnit = unit ?? lines[0]?.unit ?? "";
  return resolvedUnit ? `${formatNumber(value)} ${resolvedUnit}` : formatNumber(value);
}

function formatPerUnitLines(lines: ModelLotMaterialLineDto[], quantity: number) {
  if (lines.length === 0 || quantity <= 0) return "—";
  return lines
    .map((line) => `${line.label}: ${formatNumber(round2(line.total / quantity))} ${line.unit}`)
    .join("\n");
}

function materialCell(lines: ModelLotMaterialLineDto[], quantity: number, collapse: boolean) {
  if (collapse) return formatPerUnit(lines, quantity, "SQFT");
  return formatPerUnitLines(lines, quantity);
}

export function ProductSummaryClient() {
  const { data: products = [], isLoading: productsLoading } = useCatalogProductPicker();
  const [productId, setProductId] = useState("");
  const [lotIds, setLotIds] = useState<string[]>([]);
  const { data, isLoading, isFetching } = useProductSummary(productId, lotIds);

  const toggleLot = (lotId: string, checked: boolean) => {
    setLotIds((current) => {
      if (checked) return current.includes(lotId) ? current : [...current, lotId];
      return current.filter((id) => id !== lotId);
    });
  };

  const lotLabel =
    lotIds.length === 0
      ? "Select lots"
      : lotIds.length === 1
        ? data?.lots.find((lot) => lot.lotId === lotIds[0])?.lotNumber ?? "1 lot"
        : `${lotIds.length} lots`;

  const exportRows = () => {
    if (!data?.rows.length) return;
    const header = [
      "Name",
      "Size",
      "Model",
      "Lot",
      "Qty",
      "Board per qty",
      "Paint per qty",
      "Hardware per qty",
      "Packing per qty",
      "Edge binding per qty",
      "Glass per qty",
    ];
    const body = data.rows.map((row) => [
      row.productName,
      row.size || "",
      row.modelNumber || row.modelName,
      row.lotNumber,
      row.quantity,
      materialCell(row.boards, row.quantity, true),
      materialCell(row.paints, row.quantity, false),
      materialCell(row.hardware, row.quantity, false),
      materialCell(row.packing, row.quantity, false),
      materialCell(row.edgeBinding, row.quantity, false),
      materialCell(row.glass, row.quantity, false),
    ]);
    const slug = data.productName.trim() || "product";
    downloadCsv(`product-summary-${slug}.csv`, [header, ...body]);
  };

  return (
    <ErpPage>
      <PageHeader
        title="Product Summary"
        description="Pick a product and lots. Materials are shown as total used divided by the model quantity."
      >
        <Button
          type="button"
          variant="outline"
          disabled={!data?.rows.length}
          onClick={exportRows}
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </PageHeader>

      <ErpPageSection title="Usage by lot">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="w-full max-w-sm space-y-2">
            <Label required>Product</Label>
            <Select
              value={productId || null}
              onValueChange={(value) => {
                setProductId(value ?? "");
                setLotIds([]);
              }}
              items={products.map((product) => ({ value: product.id, label: product.name }))}
              disabled={productsLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full max-w-sm space-y-2">
            <Label required>Lots</Label>
            <Popover>
              <PopoverTrigger
                disabled={!productId || isLoading}
                className="flex h-9 w-full items-center justify-between rounded-lg border border-input bg-card px-2.5 text-left text-[13px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className={lotIds.length === 0 ? "text-muted-foreground" : undefined}>
                  {productId ? lotLabel : "Select a product first"}
                </span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </PopoverTrigger>
              <PopoverContent align="start" className="max-h-72 w-72 overflow-y-auto p-2">
                {data && data.lots.length === 0 ? (
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">
                    This product is not on any lot yet.
                  </p>
                ) : (
                  data?.lots.map((lot) => (
                    <label
                      key={lot.lotId}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
                    >
                      <Checkbox
                        checked={lotIds.includes(lot.lotId)}
                        onCheckedChange={(value) => toggleLot(lot.lotId, value === true)}
                      />
                      {lot.lotNumber}
                    </label>
                  ))
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {productId && isLoading ? <Skeleton className="mb-4 h-10 w-full max-w-sm rounded-xl" /> : null}

        {!productId ? (
          <p className="text-sm text-muted-foreground">Select a product to begin.</p>
        ) : lotIds.length === 0 ? (
          <p className="text-sm text-muted-foreground">Select at least one lot.</p>
        ) : isFetching && !data?.rows.length ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : (
          <SummaryTable rows={data?.rows ?? []} />
        )}
      </ErpPageSection>
    </ErpPage>
  );
}

function SummaryTable({ rows }: { rows: ProductSummaryRowDto[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Lot</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Board / qty</TableHead>
            <TableHead>Paint / qty</TableHead>
            <TableHead>Hardware / qty</TableHead>
            <TableHead>Packing / qty</TableHead>
            <TableHead>Edge binding / qty</TableHead>
            <TableHead>Glass / qty</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((row, index) => (
              <TableRow key={`${row.lotId}-${row.modelName}-${index}`}>
                <TableCell className="whitespace-nowrap">{row.productName}</TableCell>
                <TableCell className="whitespace-nowrap">{row.size || "—"}</TableCell>
                <TableCell className="whitespace-nowrap">{row.modelNumber || "—"}</TableCell>
                <TableCell className="whitespace-nowrap">{row.lotNumber}</TableCell>
                <TableCell>{formatNumber(row.quantity)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {materialCell(row.boards, row.quantity, true)}
                </TableCell>
                <TableCell className="whitespace-pre-line">
                  {materialCell(row.paints, row.quantity, false)}
                </TableCell>
                <TableCell className="whitespace-pre-line">
                  {materialCell(row.hardware, row.quantity, false)}
                </TableCell>
                <TableCell className="whitespace-pre-line">
                  {materialCell(row.packing, row.quantity, false)}
                </TableCell>
                <TableCell className="whitespace-pre-line">
                  {materialCell(row.edgeBinding, row.quantity, false)}
                </TableCell>
                <TableCell className="whitespace-pre-line">
                  {materialCell(row.glass, row.quantity, false)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={11} className="text-muted-foreground">
                No models for this product on the selected lots.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
