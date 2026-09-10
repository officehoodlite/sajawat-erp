"use client";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ProductFormDialog } from "@/features/inventory/components/material-module/product-form-dialog";
import {
  useCreateMaterialFamily,
  useCreateMaterialProduct,
  useDeleteMaterialFamily,
  useDeleteMaterialProduct,
  useMaterialFamilies,
  useMaterialProducts,
  useUpdateMaterialFamily,
  useUpdateMaterialProduct,
} from "@/features/inventory/hooks/use-material-module";
import { PAGE_SIZE } from "@/lib/pagination";
import type { MaterialModuleType } from "@/types/enums";
import { MATERIAL_MODULE_LABELS, UNIT_LABELS } from "@/types/enums";
import type { MaterialFamilyDto, MaterialProductDto } from "@/types/material-module";
import { formatNumber } from "@/utils/format";
import type { CreateMaterialProductInput } from "@/validators/inventory";

interface ProductsTabProps {
  type: MaterialModuleType;
}

export function ProductsTab({ type }: ProductsTabProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const limit = PAGE_SIZE;
  const label = MATERIAL_MODULE_LABELS[type];

  const { data, isLoading } = useMaterialFamilies(type, page, limit, debouncedSearch);
  const createFamily = useCreateMaterialFamily(type);
  const updateFamily = useUpdateMaterialFamily(type);
  const deleteFamily = useDeleteMaterialFamily(type);
  const createProduct = useCreateMaterialProduct(type);
  const updateProduct = useUpdateMaterialProduct(type);
  const deleteProduct = useDeleteMaterialProduct(type);

  const [familyOpen, setFamilyOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<MaterialFamilyDto | null>(null);
  const [familyName, setFamilyName] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<MaterialFamilyDto | null>(null);
  const [deleteFamilyTarget, setDeleteFamilyTarget] = useState<MaterialFamilyDto | null>(null);
  const [productOpen, setProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MaterialProductDto | null>(null);
  const [deleteProductTarget, setDeleteProductTarget] = useState<MaterialProductDto | null>(null);

  const { data: productsData, isLoading: productsLoading } = useMaterialProducts(
    type,
    1,
    100,
    "",
    selectedFamily?.id,
    !!selectedFamily
  );

  const openCreateFamily = () => {
    setEditingFamily(null);
    setFamilyName("");
    setFamilyOpen(true);
  };

  const openEditFamily = (family: MaterialFamilyDto) => {
    setEditingFamily(family);
    setFamilyName(family.name);
    setFamilyOpen(true);
  };

  const columns: ColumnDef<MaterialFamilyDto>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "productCount", header: "Items" },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              openEditFamily(row.original);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteFamilyTarget(row.original);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFamily(row.original);
            }}
          >
            Manage
          </Button>
        </div>
      ),
    },
  ];

  const handleProductSubmit = async (values: CreateMaterialProductInput) => {
    if (editingProduct) {
      await updateProduct.mutateAsync({ id: editingProduct.id, ...values });
    } else {
      await createProduct.mutateAsync(values);
    }
    setEditingProduct(null);
  };

  if (isLoading && !data) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      <PageToolbar
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
          placeholder: "Search names...",
        }}
        actions={
          <Button onClick={openCreateFamily}>
            <Plus className="mr-2 h-4 w-4" />
            Add Name
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        page={page}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
      />

      <Sheet
        open={!!selectedFamily}
        onOpenChange={(open) => {
          if (!open) setSelectedFamily(null);
        }}
      >
        <SheetContent className="w-full gap-0 p-6 sm:max-w-md">
          <SheetHeader className="px-0">
            <SheetTitle>
              {selectedFamily?.name} — {label} items
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {productsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))
            ) : productsData?.items.length ? (
              productsData.items.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
                >
                  <div className="min-w-0">
                    <span className="font-medium">{product.name}</span>
                    <p className="text-xs text-muted-foreground">
                      {UNIT_LABELS[product.unit]}
                      {product.remainingStock > 0
                        ? ` · Remaining ${formatNumber(product.remainingStock)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setEditingProduct(product);
                        setProductOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteProductTarget(product)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No items yet. Add one below.</p>
            )}
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                setEditingProduct(null);
                setProductOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={familyOpen} onOpenChange={setFamilyOpen}>
        <DialogContent className="rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingFamily ? `Edit ${label} Name` : `Add ${label} Name`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label required>Name</Label>
              <Input
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="e.g. BASE BROWN"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFamilyOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!familyName.trim()) return;
                  setFamilyOpen(false);
                  if (editingFamily) {
                    await updateFamily.mutateAsync({
                      id: editingFamily.id,
                      name: familyName.trim(),
                    });
                    if (selectedFamily?.id === editingFamily.id) {
                      setSelectedFamily({
                        ...selectedFamily,
                        name: familyName.trim(),
                      });
                    }
                  } else {
                    await createFamily.mutateAsync({ name: familyName.trim() });
                  }
                  setFamilyName("");
                  setEditingFamily(null);
                }}
                disabled={
                  !familyName.trim() || createFamily.isPending || updateFamily.isPending
                }
              >
                {editingFamily ? "Save Changes" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {productOpen && selectedFamily ? (
        <ProductFormDialog
          type={type}
          familyId={selectedFamily.id}
          open={productOpen}
          onOpenChange={(open) => {
            setProductOpen(open);
            if (!open) setEditingProduct(null);
          }}
          product={editingProduct}
          onSubmit={handleProductSubmit}
          isPending={createProduct.isPending || updateProduct.isPending}
        />
      ) : null}

      <AlertDialog open={!!deleteFamilyTarget} onOpenChange={() => setDeleteFamilyTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete name?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteFamilyTarget
                ? `This will permanently delete ${deleteFamilyTarget.name}. Delete all items under it first.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteFamily.isPending}
              onClick={async () => {
                if (!deleteFamilyTarget) return;
                await deleteFamily.mutateAsync(deleteFamilyTarget.id);
                if (selectedFamily?.id === deleteFamilyTarget.id) setSelectedFamily(null);
                setDeleteFamilyTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteProductTarget} onOpenChange={() => setDeleteProductTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteProductTarget
                ? `This will permanently delete ${deleteProductTarget.displayName}. It can only be deleted if it has no purchases, consumption, or usage on a model or lot.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteProduct.isPending}
              onClick={async () => {
                if (!deleteProductTarget) return;
                await deleteProduct.mutateAsync(deleteProductTarget.id);
                setDeleteProductTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
