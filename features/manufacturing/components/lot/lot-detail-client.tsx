"use client";

import { useState } from "react";
import Link from "next/link";
import { useSyncedTab } from "@/hooks/use-synced-tab";
import { ArrowLeft, Download, Layers, Package, Ruler } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SecondaryTabsList, SecondaryTabsTrigger } from "@/components/shared/dashboard-tabs";
import { ErpPage } from "@/components/shared/erp-page";
import { StatCard, StatCardGrid } from "@/components/shared/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddModelDialog } from "@/features/manufacturing/components/model/add-model-dialog";
import { ModelTable } from "@/features/manufacturing/components/model/model-table";
import { BoardSummaryTab } from "@/features/manufacturing/components/summary/board-summary-tab";
import { OverallSummaryTab } from "@/features/manufacturing/components/summary/overall-summary-tab";
import { WorkersTab } from "@/features/manufacturing/components/workers/workers-tab";
import {
  HardwareSummaryTab,
  PackingSummaryTab,
  PaintSummaryTab,
} from "@/features/manufacturing/components/summary/material-summary-tab";
import { useLotSummary } from "@/features/manufacturing/hooks/use-manufacturing";
import { downloadLotExcel } from "@/features/manufacturing/utils/download-lot-excel";
import { useCurrentUser } from "@/features/users/hooks/use-users";
import { formatDate, formatSqft } from "@/utils/format";
import { cn } from "@/lib/utils";

const LOT_TABS = [
  "models",
  "overall",
  "board",
  "paint",
  "hardware",
  "packing",
  "workers",
] as const;

export function LotDetailClient({ lotId }: { lotId: string }) {
  const { data: lot, isLoading } = useLotSummary(lotId);
  const { data: me } = useCurrentUser();
  const [activeTab, setActiveTab] = useSyncedTab(LOT_TABS, "models");
  const [addModelOpen, setAddModelOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Lot not found</p>
        <Link href="/manufacturing" className={cn(buttonVariants({ variant: "link" }), "mt-2")}>
          Back to lots
        </Link>
      </div>
    );
  }

  return (
    <ErpPage>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/manufacturing"
            className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "mt-1 shrink-0")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Lot {lot.lotNumber}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Created {formatDate(lot.createdAt)}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void downloadLotExcel(lot, me?.workerPrices === true)}
        >
          <Download className="mr-2 h-4 w-4" />
          Download Excel
        </Button>
      </div>

      <StatCardGrid className="lg:grid-cols-3">
        <StatCard label="Models" value={lot.models.length} icon={Layers} />
        <StatCard
          label="Board (Calculated)"
          value={formatSqft(lot.totalBoardSqft)}
          subtitle={
            lot.totalActualBoardSqft > 0
              ? `Actual: ${formatSqft(lot.totalActualBoardSqft)}`
              : undefined
          }
          icon={Ruler}
          highlight
        />
        <StatCard
          label="Actual Board Saved"
          value={lot.stockDeducted || lot.totalActualBoardSqft > 0 ? "Yes" : "No"}
          icon={Package}
        />
      </StatCardGrid>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <SecondaryTabsList>
          <SecondaryTabsTrigger value="models">Models</SecondaryTabsTrigger>
          <SecondaryTabsTrigger value="overall">Overall Summary</SecondaryTabsTrigger>
          <SecondaryTabsTrigger value="board">Board Summary</SecondaryTabsTrigger>
          <SecondaryTabsTrigger value="paint">Paint Summary</SecondaryTabsTrigger>
          <SecondaryTabsTrigger value="hardware">Hardware Summary</SecondaryTabsTrigger>
          <SecondaryTabsTrigger value="packing">Packing Summary</SecondaryTabsTrigger>
          <SecondaryTabsTrigger value="workers">Workers</SecondaryTabsTrigger>
        </SecondaryTabsList>

        <TabsContent value="models" className="space-y-4">
          <ModelTable
            lotId={lotId}
            models={lot.models}
            canAdd
            onAddModel={() => setAddModelOpen(true)}
          />
        </TabsContent>

        <TabsContent value="overall">
          <OverallSummaryTab lot={lot} />
        </TabsContent>

        <TabsContent value="board">
          <BoardSummaryTab lot={lot} />
        </TabsContent>

        <TabsContent value="paint">
          <PaintSummaryTab lot={lot} />
        </TabsContent>

        <TabsContent value="hardware">
          <HardwareSummaryTab lot={lot} />
        </TabsContent>

        <TabsContent value="packing">
          <PackingSummaryTab lot={lot} />
        </TabsContent>

        <TabsContent value="workers">
          <WorkersTab lot={lot} />
        </TabsContent>
      </Tabs>

      <AddModelDialog lotId={lotId} open={addModelOpen} onOpenChange={setAddModelOpen} />
    </ErpPage>
  );
}
