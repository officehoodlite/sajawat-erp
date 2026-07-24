import { ModelSummaryModelsClient } from "@/features/manufacturing/components/model-summary/model-summary-models-client";

type Params = { params: Promise<{ productId: string }> };

export default async function ModelSummaryProductPage({ params }: Params) {
  const { productId } = await params;
  return <ModelSummaryModelsClient productId={productId} />;
}
