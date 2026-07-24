export const LOT_STATUS = {
  PENDING: "PENDING",
  IN_PRODUCTION: "IN_PRODUCTION",
  COMPLETED: "COMPLETED",
} as const;

export type LotStatus = (typeof LOT_STATUS)[keyof typeof LOT_STATUS];

export const UNITS = ["PCS", "KG", "LTR", "ML", "MTR", "SQFT", "BOX", "ROLL", "SHEET"] as const;
export type Unit = (typeof UNITS)[number];

export const LOT_STATUS_LABELS: Record<LotStatus, string> = {
  PENDING: "Pending",
  IN_PRODUCTION: "In Production",
  COMPLETED: "Completed",
};

export const PRODUCTION_STAGES = {
  CARPENTRY: "CARPENTRY",
  FOR_PAINT: "FOR_PAINT",
  IN_PAINT: "IN_PAINT",
  IN_STOCK: "IN_STOCK",
  READY: "READY",
} as const;

export type ProductionStage = (typeof PRODUCTION_STAGES)[keyof typeof PRODUCTION_STAGES];

export const PRODUCTION_STAGE_LABELS: Record<ProductionStage, string> = {
  CARPENTRY: "Carpentry",
  FOR_PAINT: "For Paint",
  IN_PAINT: "In Paint",
  IN_STOCK: "In Stock",
  READY: "Ready",
};

export const PRODUCTION_STAGE_OPTIONS = Object.keys(
  PRODUCTION_STAGE_LABELS
) as ProductionStage[];

export const UNIT_LABELS: Record<Unit, string> = {
  PCS: "Pcs",
  KG: "Kg",
  LTR: "Litre",
  ML: "ml",
  MTR: "Mtr",
  SQFT: "SqFt",
  BOX: "Box",
  ROLL: "Roll",
  SHEET: "Sheet",
};

export type MaterialModuleType = "paint" | "hardware" | "packing";

export const MATERIAL_MODULE_LABELS: Record<MaterialModuleType, string> = {
  paint: "Paint",
  hardware: "Hardware",
  packing: "Packing",
};
