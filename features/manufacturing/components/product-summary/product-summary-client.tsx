"use client";

import { useState } from "react";
import { ErpPage, ErpPageSection } from "@/components/shared/erp-page";
import { PageHeader } from "@/components/shared/page-header";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import type { ModelLotMaterialLineDto } from "@/types/dto";
import { round2 } from "@/utils/board-calculations";
import { formatNumber } from "@/utils/format";

function formatMaterialLines(lines: ModelLotMaterialLineDto[]) {
  if (lines.length === 0) return "—";
  return lines
    .map((line) => `${line.label}: ${formatNumber(line.total)} ${line.unit}`)
    .join("\n");
}

function formatBoardTotal(lines: ModelLotMaterialLineDto[]) {
  if (lines.length === 0) return "—";
  const total = round2(lines.reduce((sum, line) => sum + line.total, 0));
  return `${formatNumber(total)} SQFT`;
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

  return (
    <ErpPage>
      <PageHeader
        title="Product Summary"
        description="Pick a product, then the lots. Every model of that product on the selected lots is listed with the materials used."
      />

      <ErpPageSection title="Selection">
        <div className="space-y-4">
          <div className="max-w-sm space-y-2">
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

          {productId && isLoading ? <Skeleton className="h-16 w-full rounded-xl" /> : null}

          {data && data.lots.length === 0 ? (
            <p className="text-sm text-muted-foreground">This product is not on any lot yet.</p>
          ) : null}

          {data && data.lots.length > 0 ? (
            <div className="space-y-2">
              <Label required>Lots</Label>
              <div className="flex flex-wrap gap-2">
                {data.lots.map((lot) => {
                  const checked = lotIds.includes(lot.lotId);
                  return (
                    <label
                      key={lot.lotId}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-[13px]"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => toggleLot(lot.lotId, value === true)}
                      />
                      {lot.lotNumber}
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </ErpPageSection>

      <ErpPageSection title="Usage by lot">
        {!productId ? (
          <p className="text-sm text-muted-foreground">Select a product to begin.</p>
        ) : lotIds.length === 0 ? (
          <p className="text-sm text-muted-foreground">Select at least one lot.</p>
        ) : isFetching && !data?.rows.length ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Lot</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Board</TableHead>
                  <TableHead>Paint</TableHead>
                  <TableHead>Hardware</TableHead>
                  <TableHead>Packing</TableHead>
                  <TableHead>Edge binding</TableHead>
                  <TableHead>Glass</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.rows.length ? (
                  data.rows.map((row, index) => (
                    <TableRow key={`${row.lotId}-${row.modelName}-${index}`}>
                      <TableCell className="whitespace-nowrap">{row.productName}</TableCell>
                      <TableCell className="whitespace-nowrap">{row.size || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{row.modelNumber || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{row.lotNumber}</TableCell>
                      <TableCell>{formatNumber(row.quantity)}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatBoardTotal(row.boards)}</TableCell>
                      <TableCell className="whitespace-pre-line">{formatMaterialLines(row.paints)}</TableCell>
                      <TableCell className="whitespace-pre-line">{formatMaterialLines(row.hardware)}</TableCell>
                      <TableCell className="whitespace-pre-line">{formatMaterialLines(row.packing)}</TableCell>
                      <TableCell className="whitespace-pre-line">{formatMaterialLines(row.edgeBinding)}</TableCell>
                      <TableCell className="whitespace-pre-line">{formatMaterialLines(row.glass)}</TableCell>
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
        )}
      </ErpPageSection>
    </ErpPage>
  );
}
