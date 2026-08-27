"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { ErpPage, ErpPageSection } from "@/components/shared/erp-page";
import { PageHeader } from "@/components/shared/page-header";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useCatalogProductPicker,
  useCreateCatalogProduct,
  useCreateCatalogProductModel,
  useDeleteCatalogProduct,
  useDeleteCatalogProductModel,
  useUpdateCatalogProduct,
} from "@/features/catalog/hooks/use-catalog-products";
import { formatCatalogModelName } from "@/lib/model-name";
import type { CatalogProductDetailDto, CatalogProductModelDto } from "@/types/dto";

function presetSummary(model: CatalogProductModelDto) {
  const parts = [
    model.boardPresetCount ? `${model.boardPresetCount} board` : null,
    model.paintPresetCount ? `${model.paintPresetCount} paint` : null,
    model.hardwarePresetCount ? `${model.hardwarePresetCount} hw` : null,
    model.packingPresetCount ? `${model.packingPresetCount} pack` : null,
    model.edgeBindingPresetCount ? `${model.edgeBindingPresetCount} edge` : null,
    model.glassPresetCount ? `${model.glassPresetCount} glass` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

function modelMaterialsHref(productId: string, modelId: string) {
  return `/products/${productId}/models/${modelId}`;
}

export function ProductsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: products = [], isLoading } = useCatalogProductPicker();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const createProduct = useCreateCatalogProduct();
  const updateProduct = useUpdateCatalogProduct();
  const deleteProduct = useDeleteCatalogProduct();
  const createModel = useCreateCatalogProductModel(selectedId ?? "");
  const deleteModel = useDeleteCatalogProductModel(selectedId ?? "");

  const [search, setSearch] = useState("");
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [modelFormOpen, setModelFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogProductDetailDto | null>(null);
  const [deleteProductTarget, setDeleteProductTarget] = useState<CatalogProductDetailDto | null>(
    null
  );
  const [deleteModelTarget, setDeleteModelTarget] = useState<CatalogProductModelDto | null>(null);
  const [productName, setProductName] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [modelSize, setModelSize] = useState("");
  const [partCount, setPartCount] = useState(1);

  useEffect(() => {
    const fromUrl = searchParams.get("productId");
    if (fromUrl) setSelectedId(fromUrl);
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  const activeProduct = products.find((p) => p.id === selectedId) ?? null;

  const selectProduct = (productId: string | null) => {
    setSelectedId(productId);
    if (productId) {
      router.replace(`/products?productId=${encodeURIComponent(productId)}`);
    } else {
      router.replace("/products");
    }
  };

  const openCreateProduct = () => {
    setEditingProduct(null);
    setProductName("");
    setProductFormOpen(true);
  };

  const openEditProduct = (product: CatalogProductDetailDto) => {
    setEditingProduct(product);
    setProductName(product.name);
    setProductFormOpen(true);
  };

  const openCreateModel = () => {
    setModelNumber("");
    setModelSize("");
    setPartCount(1);
    setModelFormOpen(true);
  };

  const openModelMaterials = (model: CatalogProductModelDto) => {
    if (!selectedId) return;
    router.push(modelMaterialsHref(selectedId, model.id));
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, name: productName.trim() });
      } else {
        const created = await createProduct.mutateAsync({ name: productName.trim() });
        selectProduct(created.id);
      }
      setProductFormOpen(false);
    } catch {
      // Toast shown by mutation onError
    }
  };

  const handleModelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !modelNumber.trim() || !modelSize.trim() || partCount < 1) return;
    try {
      const created = await createModel.mutateAsync({
        modelNumber: modelNumber.trim(),
        size: modelSize.trim(),
        partCount,
        boardPresets: [],
        paintPresets: [],
        hardwarePresets: [],
        packingPresets: [],
        edgeBindingPresets: [],
        glassPresets: [],
      });
      setModelFormOpen(false);
      router.push(modelMaterialsHref(selectedId, created.id));
    } catch {
      // Toast shown by mutation onError
    }
  };

  const modelPreview =
    modelNumber.trim() && modelSize.trim()
      ? formatCatalogModelName(modelNumber, modelSize)
      : "";

  const productColumns: ColumnDef<CatalogProductDetailDto>[] = [
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "models",
      header: "Models",
      cell: ({ row }) => row.original.models.length,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => openEditProduct(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteProductTarget(row.original)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const modelColumns: ColumnDef<CatalogProductModelDto>[] = [
    { accessorKey: "modelName", header: "Model" },
    {
      accessorKey: "partCount",
      header: "Parts",
      cell: ({ row }) => row.original.partCount,
    },
    {
      id: "presets",
      header: "Default materials",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{presetSummary(row.original)}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => openModelMaterials(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteModelTarget(row.original)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <ErpPage>
      <PageHeader
        title="Products"
        description="Manage finished products and their catalog models."
      />

      {!selectedId ? (
        <ErpPageSection title="Product Catalog">
          <PageToolbar
            search={{
              value: search,
              onChange: setSearch,
              placeholder: "Search products...",
            }}
            actions={
              <Button onClick={openCreateProduct}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            }
          />
          <div className="mt-4">
            <DataTable
              columns={productColumns}
              data={filteredProducts}
              isLoading={isLoading}
              emptyTitle="No products yet"
              emptyDescription="Add products like Bed box, Almirah, etc."
              emptyAction={
                <Button onClick={openCreateProduct}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              }
              onRowClick={(row) => selectProduct(row.id)}
            />
          </div>
        </ErpPageSection>
      ) : (
        <ErpPageSection
          title={activeProduct?.name ?? "Product"}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => selectProduct(null)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                All Products
              </Button>
              <Button onClick={openCreateModel}>
                <Plus className="mr-2 h-4 w-4" />
                Add Model
              </Button>
            </div>
          }
        >
          <DataTable
            columns={modelColumns}
            data={activeProduct?.models ?? []}
            emptyTitle="No models yet"
            emptyDescription="Add models for this product."
            emptyAction={
              <Button onClick={openCreateModel}>
                <Plus className="mr-2 h-4 w-4" />
                Add Model
              </Button>
            }
            onRowClick={openModelMaterials}
          />
        </ErpPageSection>
      )}

      <Dialog open={productFormOpen} onOpenChange={setProductFormOpen}>
        <DialogContent className="rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProductSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productName" required>
                Product Name
              </Label>
              <Input
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Bed box"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setProductFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                {editingProduct ? "Save Changes" : "Add Product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={modelFormOpen} onOpenChange={setModelFormOpen}>
        <DialogContent className="rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Model</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleModelSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="modelNumber" required>
                Model Number
              </Label>
              <Input
                id="modelNumber"
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
                placeholder="e.g. 418"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelSize" required>
                Size
              </Label>
              <Input
                id="modelSize"
                value={modelSize}
                onChange={(e) => setModelSize(e.target.value)}
                placeholder="e.g. 78 x 60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partCount" required>
                Number of parts
              </Label>
              <Input
                id="partCount"
                type="number"
                min={1}
                max={26}
                value={partCount}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setPartCount(Number.isFinite(n) ? n : 1);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Creates Part A, Part B, … for use in Production (max 26).
              </p>
            </div>
            {modelPreview ? (
              <p className="rounded-lg bg-muted/60 px-3 py-2 text-[13px] text-muted-foreground">
                Will appear as{" "}
                <span className="font-medium text-foreground">{modelPreview}</span>
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              After creating the model, you will set its default boards, paint, hardware,
              packing, edge binding, and glass on the next page.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setModelFormOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createModel.isPending ||
                  !modelNumber.trim() ||
                  !modelSize.trim() ||
                  partCount < 1 ||
                  partCount > 26
                }
              >
                Continue
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteProductTarget} onOpenChange={() => setDeleteProductTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteProductTarget?.name} and all its catalog
              models. Products already used in manufacturing lots cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteProductTarget) return;
                try {
                  await deleteProduct.mutateAsync(deleteProductTarget.id);
                  if (selectedId === deleteProductTarget.id) selectProduct(null);
                  setDeleteProductTarget(null);
                } catch {
                  setDeleteProductTarget(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteModelTarget} onOpenChange={() => setDeleteModelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete model?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteModelTarget?.modelName}. Models already used
              in manufacturing lots cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteModelTarget) return;
                try {
                  await deleteModel.mutateAsync(deleteModelTarget.id);
                  setDeleteModelTarget(null);
                } catch {
                  setDeleteModelTarget(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ErpPage>
  );
}
