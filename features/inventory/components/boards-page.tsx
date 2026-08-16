"use client";

import { ErpPage } from "@/components/shared/erp-page";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabsList, ModuleTabsTrigger } from "@/components/shared/module-tabs";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { BoardProductsTab } from "@/features/inventory/components/board-module/board-products-tab";
import { BoardStockTab } from "@/features/inventory/components/board-module/board-stock-tab";
import { BoardPurchaseHistoryTab } from "@/features/inventory/components/board-module/board-purchase-history-tab";
import { BoardConsumptionTab } from "@/features/inventory/components/board-module/board-consumption-tab";
import { useSyncedTab } from "@/hooks/use-synced-tab";

const BOARD_TABS = ["products", "stock", "purchases", "consumption"] as const;

export function BoardsPageClient() {
  const [activeTab, setActiveTab] = useSyncedTab(BOARD_TABS, "products");

  return (
    <ErpPage>
      <PageHeader
        title="Boards"
        description="Manage board products, stock, purchases, and consumption."
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
            {activeTab === "products" ? <BoardProductsTab /> : null}
          </TabsContent>
          <TabsContent value="stock" className="mt-0">
            {activeTab === "stock" ? <BoardStockTab /> : null}
          </TabsContent>
          <TabsContent value="purchases" className="mt-0">
            {activeTab === "purchases" ? <BoardPurchaseHistoryTab /> : null}
          </TabsContent>
          <TabsContent value="consumption" className="mt-0">
            {activeTab === "consumption" ? <BoardConsumptionTab /> : null}
          </TabsContent>
        </div>
      </Tabs>
    </ErpPage>
  );
}
