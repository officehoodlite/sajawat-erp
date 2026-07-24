"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { ErpPage, ErpPageSection } from "@/components/shared/erp-page";
import { PageHeader } from "@/components/shared/page-header";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  useCreateSupplier,
  useDeleteSupplier,
  useSuppliers,
  useUpdateSupplier,
} from "@/features/inventory/hooks/use-suppliers";
import type { SupplierDto } from "@/types/dto";

export function SuppliersPageClient() {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupplierDto | null>(null);
  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const resetForm = () => {
    setName("");
    setContactNumber("");
    setAddress("");
    setGstNumber("");
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (supplier: SupplierDto) => {
    setEditing(supplier);
    setName(supplier.name);
    setContactNumber(supplier.contactNumber ?? "");
    setAddress(supplier.address ?? "");
    setGstNumber(supplier.gstNumber ?? "");
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      contactNumber: contactNumber.trim() || undefined,
      address: address.trim() || undefined,
      gstNumber: gstNumber.trim() || undefined,
    };
    if (editing) {
      await updateSupplier.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createSupplier.mutateAsync(payload);
    }
    setFormOpen(false);
  };

  const columns: ColumnDef<SupplierDto>[] = [
    { accessorKey: "name", header: "Supplier Name" },
    {
      accessorKey: "contactNumber",
      header: "Contact",
      cell: ({ row }) => row.original.contactNumber ?? "—",
    },
    {
      accessorKey: "gstNumber",
      header: "GST",
      cell: ({ row }) => row.original.gstNumber ?? "—",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEdit(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row.original)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <ErpPage>
      <PageHeader
        title="Suppliers"
        description="Manage suppliers for board and material purchases."
      />

      <ErpPageSection title="Supplier List">
        <PageToolbar
          search={{
            value: search,
            onChange: setSearch,
            placeholder: "Search suppliers...",
          }}
          actions={
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          }
        />

        <div className="mt-4">
          <DataTable
            columns={columns}
            data={filtered}
            isLoading={isLoading}
            emptyTitle="No suppliers yet"
            emptyDescription="Add suppliers to select them when recording purchases."
            emptyAction={
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Supplier
              </Button>
            }
          />
        </div>
      </ErpPageSection>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplierName" required>
                Name
              </Label>
              <Input
                id="supplierName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Supplier name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierContact">Contact number</Label>
              <Input
                id="supplierContact"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierAddress">Address</Label>
              <Textarea
                id="supplierAddress"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Optional"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierGst">GST number</Label>
              <Input
                id="supplierGst"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createSupplier.isPending || updateSupplier.isPending}
              >
                {editing ? "Save Changes" : "Add Supplier"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete supplier?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteTarget?.name}. Purchases linked to this supplier
              will keep their records but lose the supplier link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteTarget) return;
                await deleteSupplier.mutateAsync(deleteTarget.id);
                setDeleteTarget(null);
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
