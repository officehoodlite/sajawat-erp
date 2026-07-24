"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErpPageSection } from "@/components/shared/erp-page";
import { useUpdateLotWorkerRates } from "@/features/manufacturing/hooks/use-manufacturing";
import type { LotWorkerRatesDto } from "@/types/dto";
import { updateLotWorkerRatesSchema } from "@/validators/manufacturing";

interface WorkerRatesFormProps {
  lotId: string;
  rates: LotWorkerRatesDto;
  readOnly?: boolean;
}

export function WorkerRatesForm({ lotId, rates, readOnly = false }: WorkerRatesFormProps) {
  const updateRates = useUpdateLotWorkerRates(lotId);

  const form = useForm({
    resolver: zodResolver(updateLotWorkerRatesSchema),
    defaultValues: rates,
  });

  useEffect(() => {
    form.reset(rates);
  }, [rates, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    await updateRates.mutateAsync(data);
  });

  const fields: Array<{ key: keyof LotWorkerRatesDto; label: string }> = [
    { key: "mfgMistriRate", label: "Manufacturing Mistri Rate" },
    { key: "mfgHalfMistriRate", label: "Manufacturing Half Mistri Rate" },
    { key: "mfgHelperRate", label: "Manufacturing Helper Rate" },
    { key: "packingMistriRate", label: "Packing Mistri Rate" },
    { key: "packingHalfMistriRate", label: "Packing Half Mistri Rate" },
    { key: "packingHelperRate", label: "Packing Helper Rate" },
  ];

  return (
    <ErpPageSection title="Labor Rates">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <Label>{label}</Label>
              <Input
                type="number"
                step="any"
                disabled={readOnly}
                {...form.register(key, { valueAsNumber: true })}
              />
            </div>
          ))}
        </div>
        {!readOnly && (
          <div className="flex justify-end">
            <Button type="submit" disabled={updateRates.isPending}>
              {updateRates.isPending ? "Saving..." : "Save Rates"}
            </Button>
          </div>
        )}
      </form>
    </ErpPageSection>
  );
}
