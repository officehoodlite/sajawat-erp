"use client";

import { GroupedConsumptionTable } from "@/features/manufacturing/components/summary/grouped-consumption-table";
import type { LotSummaryDto, MaterialConsumptionSummaryDto } from "@/types/dto";

interface MaterialSummaryTabProps {
  title: string;
  nameHeader: string;
  rows: MaterialConsumptionSummaryDto[];
  emptyMessage: string;
}

export function MaterialSummaryTab({
  title,
  nameHeader,
  rows,
  emptyMessage,
}: MaterialSummaryTabProps) {
  return (
    <GroupedConsumptionTable
      title={title}
      nameHeader={nameHeader}
      valueHeader="Quantity"
      rows={rows.map((item) => ({
        name: item.name,
        value: item.quantity,
        unit: item.unit,
      }))}
      emptyMessage={emptyMessage}
    />
  );
}

export function PaintSummaryTab({ lot }: { lot: LotSummaryDto }) {
  return (
    <MaterialSummaryTab
      title="Paint Consumption"
      nameHeader="Paint"
      rows={lot.paintConsumption}
      emptyMessage="No paint usage recorded yet."
    />
  );
}

export function HardwareSummaryTab({ lot }: { lot: LotSummaryDto }) {
  return (
    <MaterialSummaryTab
      title="Hardware Consumption"
      nameHeader="Hardware"
      rows={lot.hardwareConsumption}
      emptyMessage="No hardware usage recorded yet."
    />
  );
}

export function PackingSummaryTab({ lot }: { lot: LotSummaryDto }) {
  return (
    <MaterialSummaryTab
      title="Packing Consumption"
      nameHeader="Packing"
      rows={lot.packingConsumption}
      emptyMessage="No packing usage recorded yet."
    />
  );
}
