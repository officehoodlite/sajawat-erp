"use client";

import { useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadPurchaseTemplate } from "@/features/inventory/utils/purchase-import-template";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type PurchaseImportKind = "boards" | "paint" | "hardware" | "packing" | "edgebinding";

export type PurchaseImportResult = {
  created: number;
  updated: number;
  errors: Array<{ row: number; message: string }>;
};

interface ImportPurchasesMenuProps {
  kind: PurchaseImportKind;
  onImported?: () => void;
}

function importPath(kind: PurchaseImportKind) {
  if (kind === "boards") return "/api/inventory/boards/purchases/import";
  return `/api/inventory/${kind}/purchases/import`;
}

export function ImportPurchasesMenu({ kind, onImported }: ImportPurchasesMenuProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleUpload = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    try {
      const result = await apiFetch<PurchaseImportResult>(importPath(kind), {
        method: "POST",
        body: form,
      });
      const summary = `Imported ${result.created} new, ${result.updated} updated`;
      if (result.errors.length > 0) {
        const preview = result.errors
          .slice(0, 5)
          .map((e) => `Row ${e.row}: ${e.message}`)
          .join("; ");
        toast.warning(`${summary}. ${result.errors.length} row(s) failed. ${preview}`);
      } else {
        toast.success(summary);
      }
      if (kind === "boards") {
        queryClient.invalidateQueries({ queryKey: queryKeys.boards.stock });
        queryClient.invalidateQueries({ queryKey: ["boards", "purchases"] });
        queryClient.invalidateQueries({ queryKey: queryKeys.boards.options });
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys[kind].stock });
        queryClient.invalidateQueries({ queryKey: [kind, "purchases"] });
        queryClient.invalidateQueries({ queryKey: queryKeys[kind].options });
      }
      onImported?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleUpload(file);
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3.5 text-[13px] font-medium text-foreground outline-none hover:bg-muted"
          )}
        >
          Import
          <ChevronDown className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-max min-w-56">
          <DropdownMenuItem onClick={() => void downloadPurchaseTemplate(kind)}>
            Download template
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => inputRef.current?.click()}>
            Upload file
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export function ImportPurchasesActions({
  kind,
  onAdd,
  onImported,
}: {
  kind: PurchaseImportKind;
  onAdd: () => void;
  onImported?: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <ImportPurchasesMenu kind={kind} onImported={onImported} />
      <Button onClick={onAdd}>
        <Plus className="mr-2 h-4 w-4" />
        Add Purchase
      </Button>
    </div>
  );
}
