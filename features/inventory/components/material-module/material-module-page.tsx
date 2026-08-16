"use client";

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
import { useSyncedTab } from "@/hooks/use-synced-tab";

const MODULE_TABS = ["products", "stock", "purchases", "consumption"] as const;

interface MaterialModulePageProps {
  type: MaterialModuleType;
}

export function MaterialModulePage({ type }: MaterialModulePageProps) {
  const [activeTab, setActiveTab] = useSyncedTab(MODULE_TABS, "products");
  const config = MATERIAL_MODULES[type];

  return (
    <ErpPage>
      <PageHeader
        title={config.label}
        description={`Manage ${config.label.toLowerCase()} products, stock, purchases, and consumption.`}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">
        <ModuleTabsList>
          <ModuleTabsTrigger value="products">Products</ModuleTabsTrigger>
          <ModuleTabsTrigger value="stock">Stock</ModuleTabsTrigger>
          <ModuleTabsTrigger value="purchases">Purchase History</ModuleTabsTrigger>
          <ModuleTabsTrigger value="consumption">Consumption History</ModuleTabsTrigger>
        </ModuleTabsList>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-7">
          <TabsContent value="products" className="mt-0">
            {activeTab === "products" ? <ProductsTab type={type} /> : null}
          </TabsContent>
          <TabsContent value="stock" className="mt-0">
            {activeTab === "stock" ? <StockTab type={type} /> : null}
          </TabsContent>
          <TabsContent value="purchases" className="mt-0">
            {activeTab === "purchases" ? <PurchaseHistoryTab type={type} /> : null}
          </TabsContent>
          <TabsContent value="consumption" className="mt-0">
            {activeTab === "consumption" ? <ConsumptionTab type={type} /> : null}
          </TabsContent>
        </div>
      </Tabs>
    </ErpPage>
  );
}
