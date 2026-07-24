import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ModelDetailClient } from "@/features/manufacturing/components/model/model-detail-client";

type PageProps = {
  params: Promise<{ lotId: string; modelId: string }>;
};

function ModelDetailFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default async function ModelDetailPage({ params }: PageProps) {
  const { lotId, modelId } = await params;
  return (
    <Suspense fallback={<ModelDetailFallback />}>
      <ModelDetailClient lotId={lotId} modelId={modelId} />
    </Suspense>
  );
}
