"use client";

import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  downloadCatalogPresetTemplate,
  parseCatalogPresetImport,
  type CatalogImportedBoard,
  type CatalogImportedQty,
  type CatalogImportOption,
  type CatalogPresetImportKind,
} from "@/features/catalog/utils/catalog-preset-import";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MATERIALS: { id: CatalogPresetImportKind; label: string }[] = [
  { id: "boards", label: "Boards" },
  { id: "paint", label: "Paint" },
  { id: "hardware", label: "Hardware" },
  { id: "packing", label: "Packing" },
  { id: "edgebinding", label: "Edge Binding" },
  { id: "glass", label: "Glass" },
];

interface CatalogMaterialsImportMenuProps {
  thicknessOptions: CatalogImportOption[];
  paintOptions: CatalogImportOption[];
  hardwareOptions: CatalogImportOption[];
  packingOptions: CatalogImportOption[];
  edgeBindingOptions: CatalogImportOption[];
  glassOptions: CatalogImportOption[];
  onImportBoards: (rows: CatalogImportedBoard[]) => void;
  onImportQty: (kind: Exclude<CatalogPresetImportKind, "boards">, rows: CatalogImportedQty[]) => void;
}

export function CatalogMaterialsImportMenu({
  thicknessOptions,
  paintOptions,
  hardwareOptions,
  packingOptions,
  edgeBindingOptions,
  glassOptions,
  onImportBoards,
  onImportQty,
}: CatalogMaterialsImportMenuProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingKind, setPendingKind] = useState<CatalogPresetImportKind | null>(null);

  const optionsFor = (kind: CatalogPresetImportKind) => {
    if (kind === "boards") return thicknessOptions;
    if (kind === "paint") return paintOptions;
    if (kind === "hardware") return hardwareOptions;
    if (kind === "packing") return packingOptions;
    if (kind === "edgebinding") return edgeBindingOptions;
    return glassOptions;
  };

  const handleUpload = async (kind: CatalogPresetImportKind, file: File) => {
    try {
      const result = await parseCatalogPresetImport(kind, file, optionsFor(kind));
      const imported = kind === "boards" ? result.boards.length : result.qty.length;
      if (imported > 0) {
        if (kind === "boards") onImportBoards(result.boards);
        else onImportQty(kind, result.qty);
      }
      if (result.errors.length > 0) {
        const preview = result.errors.slice(0, 5).join("; ");
        toast.warning(
          imported > 0
            ? `Imported ${imported} row(s). ${result.errors.length} failed. ${preview}`
            : `${result.errors.length} row(s) failed. ${preview}`
        );
      } else if (imported === 0) {
        toast.error("No rows found in the file");
      } else {
        toast.success(`Imported ${imported} row(s). Click Save to keep them.`);
      }
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
          const kind = pendingKind;
          e.target.value = "";
          setPendingKind(null);
          if (file && kind) void handleUpload(kind, file);
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-[13px] font-medium text-foreground outline-none hover:bg-muted"
          )}
        >
          Import
          <ChevronDown className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-max min-w-56">
          {MATERIALS.map((material) => (
            <DropdownMenuSub key={material.id}>
              <DropdownMenuSubTrigger>{material.label}</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-max min-w-56">
                <DropdownMenuItem
                  onClick={() => void downloadCatalogPresetTemplate(material.id)}
                >
                  Download template
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setPendingKind(material.id);
                    inputRef.current?.click();
                  }}
                >
                  Upload file
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
