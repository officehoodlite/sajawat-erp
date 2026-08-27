"use client";

import Link from "next/link";
import { useSyncedTab } from "@/hooks/use-synced-tab";
import { ArrowLeft, Box, Layers, Package, Paintbrush, Scissors } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SecondaryTabsList, SecondaryTabsTrigger } from "@/components/shared/dashboard-tabs";
import { ErpPage, ErpPageSection } from "@/components/shared/erp-page";
import { StatCard, StatCardGrid } from "@/components/shared/stat-card";
import { BoardTab } from "@/features/manufacturing/components/board/board-tab";
import { PaintTab } from "@/features/manufacturing/components/paint/paint-tab";
import { HardwareTab } from "@/features/manufacturing/components/hardware/hardware-tab";
import { PackingTab } from "@/features/manufacturing/components/packing/packing-tab";
import { EdgeBindingTab } from "@/features/manufacturing/components/edgebinding/edge-binding-tab";
import {
  getModelBoardTotal,
  getTotalHardwareUsed,
  getTotalPaintUsed,
  getTotalPackingUsed,
  getTotalEdgeBindingUsed,
} from "@/features/manufacturing/utils/consumption";
import { useModel } from "@/features/manufacturing/hooks/use-manufacturing";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/utils/format";

const TAB_VALUES = ["board", "paint", "hardware", "packing", "edgebinding"] as const;

const TAB_LABELS: Record<(typeof TAB_VALUES)[number], string> = {
  board: "Board",
  paint: "Paint",
  hardware: "Hardware",
  packing: "Packing",
  edgebinding: "Edge Binding",
};

export function ModelDetailClient({ lotId, modelId }: { lotId: string; modelId: string }) {
  const { data, isLoading } = useModel(modelId);
  const [activeTab, setActiveTab] = useSyncedTab(TAB_VALUES, "board");

  const model = data?.model;
  const lot = data?.lot;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!model || !lot || lot.id !== lotId) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Model not found</p>
        <Link
          href={`/manufacturing/${lotId}?tab=models`}
          className={cn(buttonVariants({ variant: "link" }), "mt-2")}
        >
          Back to lot
        </Link>
      </div>
    );
  }

  return (
    <ErpPage>
      <div className="space-y-4">
        <Link
          href={`/manufacturing/${lotId}?tab=models`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 gap-2")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lot
        </Link>

        <ErpPageSection noPadding className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {model.modelName}
                </h1>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <span>
                  Quantity: <span className="font-medium text-foreground">{model.quantity}</span>
                </span>
                <span>
                  Lot: <span className="font-medium text-foreground">{lot.lotNumber}</span>
                </span>
                <span>
                  Product: <span className="font-medium text-foreground">{model.productName}</span>
                </span>
              </div>
            </div>
          </div>
        </ErpPageSection>
      </div>

      <StatCardGrid className="lg:grid-cols-5">
        <StatCard
          label="Board Used"
          value={`${formatNumber(getModelBoardTotal(model))} sqft`}
          icon={Layers}
          highlight
        />
        <StatCard
          label="Paint Entries"
          value={getTotalPaintUsed([model])}
          icon={Paintbrush}
        />
        <StatCard
          label="Hardware Entries"
          value={getTotalHardwareUsed([model])}
          icon={Box}
        />
        <StatCard
          label="Packing Entries"
          value={getTotalPackingUsed([model])}
          icon={Package}
        />
        <StatCard
          label="Edge Binding Entries"
          value={getTotalEdgeBindingUsed([model])}
          icon={Scissors}
        />
      </StatCardGrid>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <SecondaryTabsList>
          {TAB_VALUES.map((tab) => (
            <SecondaryTabsTrigger key={tab} value={tab}>
              {TAB_LABELS[tab]}
            </SecondaryTabsTrigger>
          ))}
        </SecondaryTabsList>

        <ErpPageSection noPadding className="p-6">
          <TabsContent value="board" className="mt-0">
            <BoardTab lotId={lotId} model={model} />
          </TabsContent>
          <TabsContent value="paint" className="mt-0">
            <PaintTab lotId={lotId} model={model} />
          </TabsContent>
          <TabsContent value="hardware" className="mt-0">
            <HardwareTab lotId={lotId} model={model} />
          </TabsContent>
          <TabsContent value="packing" className="mt-0">
            <PackingTab lotId={lotId} model={model} />
          </TabsContent>
          <TabsContent value="edgebinding" className="mt-0">
            <EdgeBindingTab lotId={lotId} model={model} />
          </TabsContent>
        </ErpPageSection>
      </Tabs>
    </ErpPage>
  );
}
