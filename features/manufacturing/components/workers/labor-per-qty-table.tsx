"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { ErpPageSection } from "@/components/shared/erp-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUpdatePolishLabor } from "@/features/manufacturing/hooks/use-manufacturing";
import { computeLaborPerQty } from "@/lib/worker-labor";
import type { LotSummaryDto } from "@/types/dto";
import { formatNumber } from "@/utils/format";

interface LaborPerQtyTableProps {
  lot: LotSummaryDto;
  readOnly?: boolean;
}

export function LaborPerQtyTable({ lot, readOnly = false }: LaborPerQtyTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const updatePolish = useUpdatePolishLabor(lot.id);

  const totalQty = useMemo(
    () => lot.models.reduce((sum, model) => sum + model.quantity, 0),
    [lot.models]
  );

  const { carpentryPerQty, packingPerQty } = useMemo(
    () => computeLaborPerQty(lot.workerEntries, lot.workerRates, totalQty),
    [lot.workerEntries, lot.workerRates, totalQty]
  );

  const hasPolish = lot.models.some((m) => m.polishLaborPerQty != null);

  if (lot.models.length === 0) {
    return (
      <ErpPageSection title="Labor per Quantity">
        <p className="text-sm text-muted-foreground">
          Add models to this lot to see labor cost per quantity.
        </p>
      </ErpPageSection>
    );
  }

  return (
    <ErpPageSection
      title="Labor per Quantity"
      description={
        totalQty > 0
          ? `Carpentry and packing totals divided across ${formatNumber(totalQty)} pcs in this lot.`
          : undefined
      }
      actions={
        !readOnly ? (
          <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
            {hasPolish ? (
              <>
                <Pencil className="mr-2 size-4" />
                Edit Polish Labor
              </>
            ) : (
              <>
                <Plus className="mr-2 size-4" />
                Add Polish Labor
              </>
            )}
          </Button>
        ) : undefined
      }
    >
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="sticky left-0 z-10 min-w-[160px] bg-muted/40">Labor</TableHead>
              {lot.models.map((model) => (
                <TableHead key={model.id} className="min-w-[120px] text-right">
                  <div className="font-medium">{model.modelName}</div>
                  <div className="text-xs font-normal text-muted-foreground">
                    Qty {formatNumber(model.quantity)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="sticky left-0 z-10 bg-background font-medium">
                Carpentry Labor
              </TableCell>
              {lot.models.map((model) => (
                <TableCell key={model.id} className="text-right tabular-nums">
                  {totalQty > 0 ? formatNumber(carpentryPerQty) : "—"}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="sticky left-0 z-10 bg-background font-medium">
                Packing Labor
              </TableCell>
              {lot.models.map((model) => (
                <TableCell key={model.id} className="text-right tabular-nums">
                  {totalQty > 0 ? formatNumber(packingPerQty) : "—"}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="sticky left-0 z-10 bg-background font-medium">
                Polish Labor
              </TableCell>
              {lot.models.map((model) => (
                <TableCell key={model.id} className="text-right tabular-nums">
                  {model.polishLaborPerQty != null
                    ? formatNumber(model.polishLaborPerQty)
                    : "—"}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <PolishLaborDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lot={lot}
        isPending={updatePolish.isPending}
        onSave={async (items) => {
          await updatePolish.mutateAsync(items);
          setDialogOpen(false);
        }}
      />
    </ErpPageSection>
  );
}

interface PolishLaborDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lot: LotSummaryDto;
  isPending: boolean;
  onSave: (
    items: Array<{ modelId: string; polishLaborPerQty: number | null }>
  ) => Promise<void>;
}

function PolishLaborDialog({
  open,
  onOpenChange,
  lot,
  isPending,
  onSave,
}: PolishLaborDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const next: Record<string, string> = {};
    for (const model of lot.models) {
      next[model.id] =
        model.polishLaborPerQty != null ? String(model.polishLaborPerQty) : "";
    }
    setValues(next);
  }, [open, lot.models]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Polish Labor per Quantity</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const items = lot.models.map((model) => {
              const raw = values[model.id]?.trim() ?? "";
              if (!raw) {
                return { modelId: model.id, polishLaborPerQty: null as number | null };
              }
              const num = Number(raw);
              return {
                modelId: model.id,
                polishLaborPerQty: Number.isFinite(num) ? num : null,
              };
            });
            await onSave(items);
          }}
        >
          {lot.models.map((model) => (
            <div key={model.id} className="space-y-2">
              <Label htmlFor={`polish-${model.id}`}>
                {model.modelName}{" "}
                <span className="text-muted-foreground">(qty {model.quantity})</span>
              </Label>
              <Input
                id={`polish-${model.id}`}
                type="number"
                min={0}
                step="any"
                placeholder="Per qty"
                value={values[model.id] ?? ""}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [model.id]: e.target.value }))
                }
              />
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
