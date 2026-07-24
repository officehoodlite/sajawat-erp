import { ModelSummaryLotsClient } from "@/features/manufacturing/components/model-summary/model-summary-lots-client";

type Params = { params: Promise<{ productId: string; modelId: string }> };

export default async function ModelSummaryLotsPage({ params }: Params) {
  const { productId, modelId } = await params;
  return <ModelSummaryLotsClient productId={productId} modelId={modelId} />;
}
