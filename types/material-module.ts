import type { MaterialModuleType, Unit } from "@/types/enums";
import type { PaginatedResponse } from "@/types/dto";

export interface MaterialProductDto {
  id: string;
  name: string;
  brand: string | null;
  unit: Unit;
  description: string | null;
  isActive: boolean;
  remainingStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialStockDto {
  id: string;
  name: string;
  brand: string | null;
  unit: Unit;
  remainingStock: number;
  isActive: boolean;
}

export interface MaterialPurchaseDto {
  id: string;
  productId: string;
  productName: string;
  unit: Unit;
  supplierId: string | null;
  supplierName: string | null;
  invoiceNumber: string | null;
  quantity: number;
  remainingQuantity: number;
  consumedQuantity: number;
  rate: number | null;
  totalCost: number | null;
  purchaseDate: string;
  remarks: string | null;
  createdAt: string;
}

export interface MaterialConsumptionDto {
  id: string;
  productId: string;
  productName: string;
  lotId: string;
  lotNumber: string;
  modelId: string;
  modelName: string;
  quantity: number;
  unit: Unit;
  remainingAfter: number;
  consumedAt: string;
}

export interface MaterialOptionDto {
  id: string;
  label: string;
  remaining: number;
  unit: Unit;
}

export type MaterialProductsResponse = PaginatedResponse<MaterialProductDto>;
export type MaterialPurchasesResponse = PaginatedResponse<MaterialPurchaseDto>;
export type MaterialConsumptionResponse = PaginatedResponse<MaterialConsumptionDto>;

export interface MaterialModuleConfig {
  type: MaterialModuleType;
  label: string;
  nameField: string;
}

export const MATERIAL_MODULES: Record<MaterialModuleType, MaterialModuleConfig> = {
  paint: { type: "paint", label: "Paint", nameField: "name" },
  hardware: { type: "hardware", label: "Hardware", nameField: "name" },
  packing: { type: "packing", label: "Packing", nameField: "name" },
  edgebinding: { type: "edgebinding", label: "Edge Binding", nameField: "name" },
  glass: { type: "glass", label: "Glass", nameField: "name" },
};
