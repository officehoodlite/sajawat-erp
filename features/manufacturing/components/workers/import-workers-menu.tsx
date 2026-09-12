"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadWorkerEntriesTemplate } from "@/features/manufacturing/utils/worker-import-template";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type WorkerImportResult = {
  lotCount: number;
  entryCount: number;
  errors: Array<{ row: number; message: string }>;
};

export function ImportWorkersMenu() {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);

  const handleUpload = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    setIsImporting(true);
    try {
      const result = await apiFetch<WorkerImportResult>("/api/manufacturing/workers/import", {
        method: "POST",
        body: form,
      });
      const summary = `Imported ${result.entryCount} entr${
        result.entryCount === 1 ? "y" : "ies"
      } to ${result.lotCount} lot${result.lotCount === 1 ? "" : "s"}`;
      if (result.errors.length > 0) {
        const preview = result.errors
          .slice(0, 5)
          .map((e) => `Row ${e.row}: ${e.message}`)
          .join("; ");
        toast.warning(`${summary}. ${result.errors.length} row(s) skipped. ${preview}`);
      } else {
        toast.success(summary);
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.lots.all });
      void queryClient.invalidateQueries({ queryKey: ["lots"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    } finally {
      setIsImporting(false);
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
          disabled={isImporting}
          className={cn(
            "inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-[13px] font-medium text-foreground outline-none hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
          )}
        >
          {isImporting ? "Importing…" : "Import"}
          <ChevronDown className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-max min-w-56">
          <DropdownMenuItem onClick={() => void downloadWorkerEntriesTemplate()}>
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
