import { z } from "zod";
import { roundDecimal } from "@/lib/decimal";
import { positiveInt } from "@/validators/inventory";

const sqftAmount = z.number().min(0, "Cannot be negative").transform(roundDecimal);

export const createLotSchema = z.object({
  lotNumber: z.string().min(1, "Lot number is required").max(100),
  remarks: z.string().max(2000).optional(),
});

export const updateLotSchema = z.object({
  lotNumber: z.string().min(1).max(100).optional(),
  remarks: z.string().max(2000).nullable().optional(),
  status: z.enum(["PENDING", "IN_PRODUCTION", "COMPLETED"]).optional(),
});

export const createModelSchema = z.object({
  productId: z.string().min(1, "Product is required").max(64),
  catalogModelId: z.string().min(1, "Model is required").max(64),
  quantity: positiveInt,
});

export const updateModelSchema = z.object({
  quantity: positiveInt.optional(),
});

export const createBoardEntrySchema = z.object({
  boardInventoryId: z.string().min(1, "Board is required").max(64),
  length: z.number().positive("Must be greater than 0").transform(roundDecimal),
  width: z.number().positive("Must be greater than 0").transform(roundDecimal),
  quantity: positiveInt,
});

export const updateBoardEntrySchema = createBoardEntrySchema.partial();

const lotActualBoardEntryBaseSchema = z.object({
  boardThicknessId: z.string().min(1, "Board is required").max(64),
  length: sqftAmount,
  width: sqftAmount,
  quantity: z.number().int().min(0).max(1_000_000),
  sqftIn: sqftAmount,
  sqftOut: sqftAmount,
});

export const createLotActualBoardEntrySchema = lotActualBoardEntryBaseSchema.refine(
  (data) =>
    (data.length > 0 && data.width > 0 && data.quantity > 0) ||
    data.sqftIn > 0 ||
    data.sqftOut > 0,
  {
    message: "Enter dimensions (L×W×Qty) or In/Out sqft",
    path: ["length"],
  }
);

export const updateLotActualBoardEntrySchema = lotActualBoardEntryBaseSchema.partial();

export const createMaterialEntrySchema = z.object({
  quantity: z.number().positive("Must be greater than 0").transform(roundDecimal),
});

export const createPaintEntrySchema = createMaterialEntrySchema.extend({
  paintProductId: z.string().min(1).max(64),
});

export const createHardwareEntrySchema = createMaterialEntrySchema.extend({
  hardwareProductId: z.string().min(1).max(64),
});

export const createPackingEntrySchema = createMaterialEntrySchema.extend({
  packingProductId: z.string().min(1).max(64),
});

export const createEdgeBindingEntrySchema = createMaterialEntrySchema.extend({
  edgeBindingProductId: z.string().min(1).max(64),
});

export const createGlassEntrySchema = createMaterialEntrySchema.extend({
  glassProductId: z.string().min(1).max(64),
});

export const updatePaintEntrySchema = createPaintEntrySchema;
export const updateHardwareEntrySchema = createHardwareEntrySchema;
export const updatePackingEntrySchema = createPackingEntrySchema;
export const updateEdgeBindingEntrySchema = createEdgeBindingEntrySchema;
export const updateGlassEntrySchema = createGlassEntrySchema;

const coercedNonNegativeNumber = z.coerce
  .number()
  .min(0, "Cannot be negative")
  .transform(roundDecimal);

const coercedNonNegativeInt = z.coerce.number().int().min(0, "Cannot be negative");

export const updateLotWorkerRatesSchema = z.object({
  mfgMistriRate: coercedNonNegativeNumber,
  mfgHalfMistriRate: coercedNonNegativeNumber,
  mfgHelperRate: coercedNonNegativeNumber,
  packingMistriRate: coercedNonNegativeNumber,
  packingHalfMistriRate: coercedNonNegativeNumber,
  packingHelperRate: coercedNonNegativeNumber,
});

const workerNamesField = z.preprocess(
  (val) => {
    if (!Array.isArray(val)) return val;
    return val.map((name) => String(name).trim()).filter(Boolean);
  },
  z
    .array(z.string().min(1, "Worker name is required").max(120))
    .min(1, "Add at least one worker")
    .max(200)
);

const lotWorkerEntryBaseSchema = z.object({
  type: z.enum(["MANUFACTURING", "PACKING"]),
  workDate: z.coerce.date(),
  workerNames: workerNamesField,
  machinery: z.string().max(200).optional(),
  mistri: coercedNonNegativeInt.max(10_000),
  halfMistri: coercedNonNegativeInt.max(10_000),
  helper: coercedNonNegativeInt.max(10_000),
  hours: z.coerce.number().int().positive("Hours must be greater than 0").max(168),
  packQty: coercedNonNegativeInt.max(1_000_000).optional(),
});

export const createLotWorkerEntrySchema = lotWorkerEntryBaseSchema.refine(
  (data) => data.type !== "PACKING" || data.packQty !== undefined,
  { message: "Pack qty is required for packing entries", path: ["packQty"] }
);

export const updateLotWorkerEntrySchema = lotWorkerEntryBaseSchema.partial();

export const updatePolishLaborSchema = z.object({
  polishLaborPerQty: z
    .union([
      z.number().min(0, "Cannot be negative").transform(roundDecimal),
      z.null(),
    ]),
});

export type CreateLotInput = z.infer<typeof createLotSchema>;
export type UpdateLotInput = z.infer<typeof updateLotSchema>;
export type CreateModelInput = z.infer<typeof createModelSchema>;
export type CreateBoardEntryInput = z.infer<typeof createBoardEntrySchema>;
export type CreateLotActualBoardEntryInput = z.infer<typeof createLotActualBoardEntrySchema>;
export type UpdateLotWorkerRatesInput = z.infer<typeof updateLotWorkerRatesSchema>;
export type CreateLotWorkerEntryInput = z.infer<typeof createLotWorkerEntrySchema>;
export type UpdateLotWorkerEntryInput = z.infer<typeof updateLotWorkerEntrySchema>;
export type UpdatePolishLaborInput = z.infer<typeof updatePolishLaborSchema>;
