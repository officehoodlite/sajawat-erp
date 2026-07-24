import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LotDetailClient } from "@/features/manufacturing/components/lot/lot-detail-client";

type PageProps = {
  params: Promise<{ lotId: string }>;
};

function LotDetailFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default async function LotDetailPage({ params }: PageProps) {
  const { lotId } = await params;
  return (
    <Suspense fallback={<LotDetailFallback />}>
      <LotDetailClient lotId={lotId} />
    </Suspense>
  );
}
