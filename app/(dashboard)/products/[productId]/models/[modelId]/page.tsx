import { ProductModelMaterialsClient } from "@/features/catalog/components/product-model-materials-client";

type Params = { params: Promise<{ productId: string; modelId: string }> };

export default async function ProductModelMaterialsPage({ params }: Params) {
  const { productId, modelId } = await params;
  return <ProductModelMaterialsClient productId={productId} modelId={modelId} />;
}
