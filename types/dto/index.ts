import type { LotStatus, ProductionStage, Unit } from "@/types/enums";

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductDto {
  id: string;
  name: string;
}

export interface CatalogModelPresetItemDto {
  id: string;
  productId: string;
  label: string;
  quantity: number;
}

export interface CatalogBoardPresetItemDto {
  id: string;
  boardThicknessId: string;
  label: string;
  length: number;
  width: number;
  quantity: number;
}

export interface CatalogProductModelDto {
  id: string;
  productId: string;
  modelName: string;
  partCount: number;
  boardPresetCount: number;
  paintPresetCount: number;
  hardwarePresetCount: number;
  packingPresetCount: number;
  edgeBindingPresetCount: number;
  glassPresetCount: number;
  boardPresets: CatalogBoardPresetItemDto[];
  paintPresets: CatalogModelPresetItemDto[];
  hardwarePresets: CatalogModelPresetItemDto[];
  packingPresets: CatalogModelPresetItemDto[];
  edgeBindingPresets: CatalogModelPresetItemDto[];
  glassPresets: CatalogModelPresetItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CatalogProductDetailDto {
  id: string;
  name: string;
  models: CatalogProductModelDto[];
  createdAt: string;
  updatedAt: string;
}

export interface SupplierDto {
  id: string;
  name: string;
  contactNumber: string | null;
  address: string | null;
  gstNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BoardDto {
  id: string;
  materialName: string;
  thicknessCount: number;
}

export interface BoardThicknessDto {
  id: string;
  boardId: string;
  thickness: string;
  materialName: string;
  remainingSqft: number;
}

export interface BoardInventoryDto {
  id: string;
  boardThicknessId: string;
  materialName: string;
  thickness: string;
  purchaseSqft: number;
  remainingSqft: number;
  purchaseDate: string;
  supplierId: string | null;
  supplierName: string | null;
  rate: number | null;
}

export interface BoardStockDto {
  id: string;
  materialName: string;
  thickness: string;
  remainingSqft: number;
}

export interface BoardPurchaseDto {
  id: string;
  boardThicknessId: string;
  materialName: string;
  thickness: string;
  supplierId: string | null;
  supplierName: string | null;
  quantity: number;
  remainingQuantity: number;
  consumedQuantity: number;
  rate: number | null;
  totalCost: number | null;
  purchaseDate: string;
  createdAt: string;
}

export interface BoardConsumptionDto {
  id: string;
  materialName: string;
  thickness: string;
  lotId: string;
  lotNumber: string;
  modelId: string;
  modelName: string;
  quantity: number;
  consumedAt: string;
}

export type BoardMaterialsResponse = PaginatedResponse<BoardDto>;
export type BoardPurchasesResponse = PaginatedResponse<BoardPurchaseDto>;
export type BoardConsumptionResponse = PaginatedResponse<BoardConsumptionDto>;

export interface BoardOptionDto {
  id: string;
  label: string;
  materialName: string;
  thickness: string;
  remainingSqft: number;
  supplierId: string | null;
  supplierName: string | null;
}

export interface PaintEntryDto {
  id: string;
  modelId: string;
  paintProductId: string;
  paintName: string;
  quantity: number;
  unit: Unit;
}

export interface HardwareEntryDto {
  id: string;
  modelId: string;
  hardwareProductId: string;
  hardwareName: string;
  quantity: number;
  unit: Unit;
}

export interface PackingEntryDto {
  id: string;
  modelId: string;
  packingProductId: string;
  packingName: string;
  quantity: number;
  unit: Unit;
}

export interface EdgeBindingEntryDto {
  id: string;
  modelId: string;
  edgeBindingProductId: string;
  edgeBindingName: string;
  quantity: number;
  unit: Unit;
}

export interface GlassEntryDto {
  id: string;
  modelId: string;
  glassProductId: string;
  glassName: string;
  quantity: number;
  unit: Unit;
}

export interface LotListItemDto {
  id: string;
  lotNumber: string;
  status: LotStatus;
  modelCount: number;
  createdAt: string;
  remarks: string | null;
}

export interface BoardEntryDto {
  id: string;
  modelId: string;
  boardInventoryId: string;
  materialName: string;
  thickness: string;
  length: number;
  width: number;
  quantity: number;
  sqftPerPiece: number;
  totalSqft: number;
}

export interface MaterialOptionDto {
  id: string;
  label: string;
  remaining: number;
  unit: Unit;
}

export interface ModelBoardPresetDto {
  boardThicknessId: string;
  label: string;
  materialName: string;
  thickness: string;
  length: number;
  width: number;
  quantity: number;
}

export interface ModelMaterialPresetDto {
  productId: string;
  label: string;
  quantity: number;
}

export interface ModelDto {
  id: string;
  lotId: string;
  productId: string;
  productName: string;
  catalogModelId: string;
  modelName: string;
  quantity: number;
  partCount: number;
  polishLaborPerQty: number | null;
  boardEntries: BoardEntryDto[];
  paintEntries: PaintEntryDto[];
  hardwareEntries: HardwareEntryDto[];
  packingEntries: PackingEntryDto[];
  edgeBindingEntries: EdgeBindingEntryDto[];
  glassEntries: GlassEntryDto[];
  boardPresets: ModelBoardPresetDto[];
  paintPresets: ModelMaterialPresetDto[];
  hardwarePresets: ModelMaterialPresetDto[];
  packingPresets: ModelMaterialPresetDto[];
  edgeBindingPresets: ModelMaterialPresetDto[];
  glassPresets: ModelMaterialPresetDto[];
}

export interface BoardUsageSummaryDto {
  materialLabel: string;
  totalSqft: number;
}

export interface BoardWastageSummaryDto {
  materialLabel: string;
  calculatedSqft: number;
  actualSqft: number;
  wastageSqft: number;
  wastagePercent: number | null;
}

export interface BoardModelMaterialUsageDto {
  modelId: string;
  modelName: string;
  materialLabel: string;
  calculatedSqft: number;
}

export interface BoardActualConsumptionRowDto {
  materialLabel: string;
  wastagePercent: number | null;
  actualSqft: number;
  modelValues: Record<string, number>;
  rowTotal: number;
  variance: number;
}

export interface LotActualBoardEntryDto {
  id: string;
  lotId: string;
  boardThicknessId: string;
  materialName: string;
  thickness: string;
  length: number;
  width: number;
  quantity: number;
  sqftIn: number;
  sqftOut: number;
  totalSqft: number;
}

export interface ModelSummaryDto {
  id: string;
  lotId: string;
  productId: string;
  productName: string;
  catalogModelId: string;
  modelName: string;
  quantity: number;
  partCount: number;
  polishLaborPerQty: number | null;
  totalBoardSqft: number;
}

export interface MaterialConsumptionSummaryDto {
  name: string;
  quantity: number;
  unit: Unit;
}

export interface MaterialByModelRowDto {
  materialLabel: string;
  unit: Unit;
  modelValues: Record<string, number>;
  rowTotal: number;
}

export interface LotSummaryDto {
  id: string;
  lotNumber: string;
  status: LotStatus;
  stockDeducted: boolean;
  createdAt: string;
  remarks: string | null;
  models: ModelSummaryDto[];
  boardUsageSummary: BoardUsageSummaryDto[];
  totalBoardSqft: number;
  actualBoardEntries: LotActualBoardEntryDto[];
  actualBoardUsageSummary: BoardUsageSummaryDto[];
  totalActualBoardSqft: number;
  boardWastageSummary: BoardWastageSummaryDto[];
  boardCalculatedByModel: BoardModelMaterialUsageDto[];
  boardActualConsumption: BoardActualConsumptionRowDto[];
  paintConsumption: MaterialConsumptionSummaryDto[];
  hardwareConsumption: MaterialConsumptionSummaryDto[];
  packingConsumption: MaterialConsumptionSummaryDto[];
  edgeBindingConsumption: MaterialConsumptionSummaryDto[];
  glassConsumption: MaterialConsumptionSummaryDto[];
  paintByModel: MaterialByModelRowDto[];
  hardwareByModel: MaterialByModelRowDto[];
  packingByModel: MaterialByModelRowDto[];
  edgeBindingByModel: MaterialByModelRowDto[];
  glassByModel: MaterialByModelRowDto[];
  workerRates: LotWorkerRatesDto;
  workerEntries: LotWorkerEntryDto[];
  workerSummaries: LotWorkerSummaryDto[];
}

export interface LotWorkerRatesDto {
  mfgMistriRate: number;
  mfgHalfMistriRate: number;
  mfgHelperRate: number;
  packingMistriRate: number;
  packingHalfMistriRate: number;
  packingHelperRate: number;
}

export interface LotWorkerEntryDto {
  id: string;
  type: "MANUFACTURING" | "PACKING";
  workDate: string;
  workerNames: string[];
  machinery: string | null;
  mistri: number;
  halfMistri: number;
  helper: number;
  hours: number;
  packQty: number | null;
  tMistri: number;
  hMistri: number;
  tHelper: number;
}

export interface LotWorkerSummaryDto {
  workerName: string;
  mfgTMistri: number;
  mfgHMistri: number;
  mfgTHelper: number;
  packTMistri: number;
  packHMistri: number;
  packTHelper: number;
  mfgTMistriAmount: number;
  mfgHMistriAmount: number;
  mfgTHelperAmount: number;
  packTMistriAmount: number;
  packHMistriAmount: number;
  packTHelperAmount: number;
  totalAmount: number;
}

export interface ModelLotMaterialLineDto {
  label: string;
  unit: string;
  perUnit: number;
  total: number;
}

export interface ModelLotSummaryDto {
  lotId: string;
  lotNumber: string;
  status: LotStatus;
  createdAt: string;
  quantity: number;
  boards: ModelLotMaterialLineDto[];
  paints: ModelLotMaterialLineDto[];
  hardware: ModelLotMaterialLineDto[];
  packing: ModelLotMaterialLineDto[];
  edgeBinding: ModelLotMaterialLineDto[];
  glass: ModelLotMaterialLineDto[];
}

export interface CatalogModelLotSummariesDto {
  catalogModelId: string;
  productId: string;
  productName: string;
  modelName: string;
  lots: ModelLotSummaryDto[];
}

export interface LotWorkerCategoryTotalDto {
  category: string;
  count: number;
  rate: number;
  total: number;
}

export interface ModelDetailResponseDto {
  model: ModelDto;
  lot: {
    id: string;
    lotNumber: string;
    status: LotStatus;
  };
}

export interface ManufacturingEntryAckDto {
  ok: true;
  lotId: string;
  modelId: string;
}

export interface LotDetailDto {
  id: string;
  lotNumber: string;
  status: LotStatus;
  stockDeducted: boolean;
  createdAt: string;
  remarks: string | null;
  models: ModelDto[];
  boardUsageSummary: BoardUsageSummaryDto[];
  totalBoardSqft: number;
}

export interface ProductionEntryDto {
  id: string;
  lotId: string;
  lotNumber: string;
  manufacturingModelId: string;
  modelName: string;
  productName: string;
  catalogModelId: string;
  modelQuantity: number;
  partCount: number;
  parts: string[];
  details: string;
  statusText: string | null;
  description: string | null;
  stage: ProductionStage;
  workDate: string;
  /** Initial quantity for this entry (capacity consumed per selected part). */
  quantity: number;
  carpentryQty: number;
  paintingReadyQty: number;
  paintingStatusQty: number;
  completedReadyQty: number;
  completedOutQty: number;
  paintingReady: number;
  paintingBalance: number;
  completedReady: number;
  completedBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionPartRemainingDto {
  part: string;
  remaining: number;
}

export interface ProductionLotModelDto {
  id: string;
  modelName: string;
  productName: string;
  catalogModelId: string;
  quantity: number;
  partCount: number;
  partOptions: string[];
  /** @deprecated Prefer remainingCapacityByPart */
  remainingCapacity: number;
  remainingCapacityByPart: ProductionPartRemainingDto[];
}

export interface ProductionSuggestionsDto {
  details: string[];
  statuses: string[];
}
