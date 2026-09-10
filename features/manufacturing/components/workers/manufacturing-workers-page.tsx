"use client";

import { ErpPage } from "@/components/shared/erp-page";
import { PageHeader } from "@/components/shared/page-header";
import { ManufacturingWorkersTab } from "@/features/manufacturing/components/workers/manufacturing-workers-tab";

export function ManufacturingWorkersPageClient() {
  return (
    <ErpPage>
      <PageHeader
        title="Workers"
        description="Select lots, add multiple work entries to a draft, then upload them all at once."
      />
      <ManufacturingWorkersTab />
    </ErpPage>
  );
}
