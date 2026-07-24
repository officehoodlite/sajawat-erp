"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ErpPage } from "@/components/shared/erp-page";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabsList, ModuleTabsTrigger } from "@/components/shared/module-tabs";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { BoardProductsTab } from "@/features/inventory/components/board-module/board-products-tab";
import { BoardStockTab } from "@/features/inventory/components/board-module/board-stock-tab";
import { BoardPurchaseHistoryTab } from "@/features/inventory/components/board-module/board-purchase-history-tab";
import { BoardConsumptionTab } from "@/features/inventory/components/board-module/board-consumption-tab";

const BOARD_TABS = ["products", "stock", "purchases", "consumption"] as const;
type BoardTab = (typeof BOARD_TABS)[number];

export function BoardsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: BoardTab = BOARD_TABS.includes(tabParam as BoardTab)
    ? (tabParam as BoardTab)
    : "products";

  const setTab = (tab: BoardTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <ErpPage>
      <PageHeader
        title="Boards"
        description="Manage board products, stock, purchases, and consumption."
      />

      <Tabs value={activeTab} onValueChange={(v) => setTab(v as BoardTab)} className="space-y-0">
        <ModuleTabsList>
          <ModuleTabsTrigger value="products">Products</ModuleTabsTrigger>
          <ModuleTabsTrigger value="stock">Stock</ModuleTabsTrigger>
          <ModuleTabsTrigger value="purchases">Purchase History</ModuleTabsTrigger>
          <ModuleTabsTrigger value="consumption">Consumption History</ModuleTabsTrigger>
        </ModuleTabsList>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-7">
          <TabsContent value="products" className="mt-0">
            <BoardProductsTab />
          </TabsContent>
          <TabsContent value="stock" className="mt-0">
            <BoardStockTab />
          </TabsContent>
          <TabsContent value="purchases" className="mt-0">
            <BoardPurchaseHistoryTab />
          </TabsContent>
          <TabsContent value="consumption" className="mt-0">
            <BoardConsumptionTab />
          </TabsContent>
        </div>
      </Tabs>
    </ErpPage>
  );
}
