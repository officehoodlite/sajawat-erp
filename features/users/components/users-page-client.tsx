"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { ErpPage } from "@/components/shared/erp-page";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateUser,
  useCurrentUser,
  useUpdateUser,
  useUsers,
} from "@/features/users/hooks/use-users";
import type { UserDto } from "@/services/users/user.service";

export function UsersPageClient() {
  const { data: me, isLoading: meLoading } = useCurrentUser();
  const { data: users = [], isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserDto | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">("USER");
  const [workerPrices, setWorkerPrices] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const openCreate = () => {
    setEditing(null);
    setUsername("");
    setPassword("");
    setRole("USER");
    setWorkerPrices(false);
    setIsActive(true);
    setOpen(true);
  };

  const openEdit = (user: UserDto) => {
    setEditing(user);
    setUsername(user.username);
    setPassword("");
    setRole(user.role);
    setWorkerPrices(user.workerPrices);
    setIsActive(user.isActive);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateUser.mutateAsync({
          id: editing.id,
          username: username.trim(),
          ...(password ? { password } : {}),
          role,
          workerPrices: role === "ADMIN" ? true : workerPrices,
          isActive,
        });
      } else {
        if (!password) return;
        await createUser.mutateAsync({
          username: username.trim(),
          password,
          role,
          workerPrices: role === "ADMIN" ? true : workerPrices,
          isActive,
        });
      }
      setOpen(false);
    } catch {
      // toast from mutation
    }
  };

  const columns: ColumnDef<UserDto>[] = [
    { accessorKey: "username", header: "Username" },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (row.original.role === "ADMIN" ? "Admin" : "User"),
    },
    {
      accessorKey: "workerPrices",
      header: "Worker price",
      cell: ({ row }) => (row.original.workerPrices ? "Yes" : "No"),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (row.original.isActive ? "Active" : "Inactive"),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button size="sm" variant="ghost" onClick={() => openEdit(row.original)}>
          <Pencil className="mr-2 size-4" />
          Edit
        </Button>
      ),
    },
  ];

  if (!meLoading && me?.role !== "ADMIN") {
    return (
      <ErpPage>
        <PageHeader title="Users" description="Only admins can manage users." />
      </ErpPage>
    );
  }

  return (
    <ErpPage>
      <PageHeader title="Users" description="Create logins and choose which features each person can use.">
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 size-4" />
          Add user
        </Button>
      </PageHeader>

      <DataTable columns={columns} data={users} isLoading={isLoading} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit user" : "Add user"}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username" required>
                Username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" required={!editing}>
                {editing ? "New password (optional)" : "Password"}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole((v as "ADMIN" | "USER") ?? "USER")}
                items={[
                  { value: "USER", label: "User" },
                  { value: "ADMIN", label: "Admin" },
                ]}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={role === "ADMIN" || workerPrices}
                disabled={role === "ADMIN"}
                onCheckedChange={(v) => setWorkerPrices(v === true)}
              />
              Worker price — see and edit labor rates and totals
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={isActive} onCheckedChange={(v) => setIsActive(v === true)} />
              Active
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createUser.isPending ||
                  updateUser.isPending ||
                  !username.trim() ||
                  (!editing && !password)
                }
              >
                {createUser.isPending || updateUser.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </ErpPage>
  );
}
