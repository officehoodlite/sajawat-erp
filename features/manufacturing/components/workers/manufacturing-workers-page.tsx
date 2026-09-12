"use client";

import { ErpPage } from "@/components/shared/erp-page";
import { PageHeader } from "@/components/shared/page-header";
import { ManufacturingWorkersTab } from "@/features/manufacturing/components/workers/manufacturing-workers-tab";

export function ManufacturingWorkersPageClient() {
  return (
    <ErpPage>
      <PageHeader
        title="Workers"
        description="Select lots, then add entries manually or import an Excel file onto those selected lots."
      />
      <ManufacturingWorkersTab />
    </ErpPage>
  );
}
