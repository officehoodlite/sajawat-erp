"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ErpPage } from "@/components/shared/erp-page";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabsList, ModuleTabsTrigger } from "@/components/shared/module-tabs";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ProductsTab } from "@/features/inventory/components/material-module/products-tab";
import { StockTab } from "@/features/inventory/components/material-module/stock-tab";
import { PurchaseHistoryTab } from "@/features/inventory/components/material-module/purchase-history-tab";
import { ConsumptionTab } from "@/features/inventory/components/material-module/consumption-tab";
import { MATERIAL_MODULES } from "@/types/material-module";
import type { MaterialModuleType } from "@/types/enums";

const MODULE_TABS = ["products", "stock", "purchases", "consumption"] as const;
type ModuleTab = (typeof MODULE_TABS)[number];

interface MaterialModulePageProps {
  type: MaterialModuleType;
}

export function MaterialModulePage({ type }: MaterialModulePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: ModuleTab = MODULE_TABS.includes(tabParam as ModuleTab)
    ? (tabParam as ModuleTab)
    : "products";

  const config = MATERIAL_MODULES[type];

  const setTab = (tab: ModuleTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <ErpPage>
      <PageHeader
        title={config.label}
        description={`Manage ${config.label.toLowerCase()} products, stock, purchases, and consumption.`}
      />

      <Tabs value={activeTab} onValueChange={(v) => setTab(v as ModuleTab)} className="space-y-0">
        <ModuleTabsList>
          <ModuleTabsTrigger value="products">Products</ModuleTabsTrigger>
          <ModuleTabsTrigger value="stock">Stock</ModuleTabsTrigger>
          <ModuleTabsTrigger value="purchases">Purchase History</ModuleTabsTrigger>
          <ModuleTabsTrigger value="consumption">Consumption History</ModuleTabsTrigger>
        </ModuleTabsList>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-7">
          <TabsContent value="products" className="mt-0">
            <ProductsTab type={type} />
          </TabsContent>
          <TabsContent value="stock" className="mt-0">
            <StockTab type={type} />
          </TabsContent>
          <TabsContent value="purchases" className="mt-0">
            <PurchaseHistoryTab type={type} />
          </TabsContent>
          <TabsContent value="consumption" className="mt-0">
            <ConsumptionTab type={type} />
          </TabsContent>
        </div>
      </Tabs>
    </ErpPage>
  );
}
