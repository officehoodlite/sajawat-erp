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
import {
  useBoardMaterials,
  useBoardThicknesses,
  useCreateBoardMaterial,
  useCreateBoardThickness,
  useDeleteBoardThickness,
  useUpdateBoardMaterial,
  useUpdateBoardThickness,
} from "@/features/inventory/hooks/use-inventory";
import { PAGE_SIZE } from "@/lib/pagination";
import type { BoardDto, BoardThicknessDto } from "@/types/dto";

export function BoardProductsTab() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const limit = PAGE_SIZE;

  const { data, isLoading } = useBoardMaterials(page, limit, debouncedSearch);
  const createMaterial = useCreateBoardMaterial();
  const updateMaterial = useUpdateBoardMaterial();
  const createThickness = useCreateBoardThickness();
  const updateThickness = useUpdateBoardThickness();
  const deleteThickness = useDeleteBoardThickness();

  const [materialOpen, setMaterialOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<BoardDto | null>(null);
  const [materialName, setMaterialName] = useState("");
  const [selectedBoard, setSelectedBoard] = useState<BoardDto | null>(null);
  const [thicknessOpen, setThicknessOpen] = useState(false);
  const [editingThickness, setEditingThickness] = useState<BoardThicknessDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BoardThicknessDto | null>(null);
  const [thicknessValue, setThicknessValue] = useState("");

  const { data: thicknesses, isLoading: thicknessesLoading } = useBoardThicknesses(
    selectedBoard?.id ?? ""
  );

  const openCreateMaterial = () => {
    setEditingMaterial(null);
    setMaterialName("");
    setMaterialOpen(true);
  };

  const openEditMaterial = (board: BoardDto) => {
    setEditingMaterial(board);
    setMaterialName(board.materialName);
    setMaterialOpen(true);
  };

  const openAddThickness = () => {
    setEditingThickness(null);
    setThicknessValue("");
    setThicknessOpen(true);
  };

  const openEditThickness = (thickness: BoardThicknessDto) => {
    setEditingThickness(thickness);
    setThicknessValue(thickness.thickness);
    setThicknessOpen(true);
  };

  const columns: ColumnDef<BoardDto>[] = [
    { accessorKey: "materialName", header: "Material" },
    { accessorKey: "thicknessCount", header: "Thicknesses" },
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
              openEditMaterial(row.original);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBoard(row.original);
            }}
          >
            Manage
          </Button>
        </div>
      ),
    },
  ];

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
          placeholder: "Search materials...",
        }}
        actions={
          <Button onClick={openCreateMaterial}>
            <Plus className="mr-2 h-4 w-4" />
            Add Material
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
        open={!!selectedBoard}
        onOpenChange={(open) => {
          if (!open) setSelectedBoard(null);
        }}
      >
        <SheetContent className="w-full gap-0 p-6 sm:max-w-md">
          <SheetHeader className="px-0">
            <SheetTitle>{selectedBoard?.materialName} — Thicknesses</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {thicknessesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))
            ) : thicknesses?.length ? (
              thicknesses.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
                >
                  <div className="min-w-0">
                    <span className="font-medium">{t.thickness}</span>
                    {t.remainingSqft > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Remaining {t.remainingSqft} sqft
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEditThickness(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={t.remainingSqft > 0}
                      title={
                        t.remainingSqft > 0
                          ? "Cannot delete thickness with remaining stock"
                          : "Delete thickness"
                      }
                      onClick={() => setDeleteTarget(t)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No thicknesses yet. Add one below.</p>
            )}
            <Button className="w-full" variant="outline" onClick={openAddThickness}>
              <Plus className="mr-2 h-4 w-4" />
              Add Thickness
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={materialOpen} onOpenChange={setMaterialOpen}>
        <DialogContent className="rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? "Edit Board Material" : "Add Board Material"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label required>Material Name</Label>
              <Input
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                placeholder="e.g. MDF"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setMaterialOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!materialName.trim()) return;
                  setMaterialOpen(false);
                  if (editingMaterial) {
                    await updateMaterial.mutateAsync({
                      id: editingMaterial.id,
                      materialName: materialName.trim(),
                    });
                    if (selectedBoard?.id === editingMaterial.id) {
                      setSelectedBoard({
                        ...selectedBoard,
                        materialName: materialName.trim(),
                      });
                    }
                  } else {
                    await createMaterial.mutateAsync({ materialName: materialName.trim() });
                  }
                  setMaterialName("");
                  setEditingMaterial(null);
                }}
                disabled={
                  !materialName.trim() || createMaterial.isPending || updateMaterial.isPending
                }
              >
                {editingMaterial ? "Save Changes" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={thicknessOpen} onOpenChange={setThicknessOpen}>
        <DialogContent className="rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingThickness ? "Edit Thickness" : "Add Thickness"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label required>Thickness</Label>
              <Input
                value={thicknessValue}
                onChange={(e) => setThicknessValue(e.target.value)}
                placeholder="e.g. 18 MM"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setThicknessOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!thicknessValue.trim() || !selectedBoard) return;
                  setThicknessOpen(false);
                  if (editingThickness) {
                    await updateThickness.mutateAsync({
                      id: editingThickness.id,
                      boardId: selectedBoard.id,
                      thickness: thicknessValue.trim(),
                    });
                  } else {
                    await createThickness.mutateAsync({
                      boardId: selectedBoard.id,
                      thickness: thicknessValue.trim(),
                    });
                  }
                  setThicknessValue("");
                  setEditingThickness(null);
                }}
                disabled={
                  !thicknessValue.trim() ||
                  !selectedBoard ||
                  createThickness.isPending ||
                  updateThickness.isPending
                }
              >
                {editingThickness ? "Save Changes" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete thickness?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This will permanently delete ${deleteTarget.thickness}. You can only delete thicknesses with no remaining stock.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteThickness.isPending}
              onClick={async () => {
                if (!deleteTarget || !selectedBoard) return;
                await deleteThickness.mutateAsync({
                  id: deleteTarget.id,
                  boardId: selectedBoard.id,
                });
                setDeleteTarget(null);
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
