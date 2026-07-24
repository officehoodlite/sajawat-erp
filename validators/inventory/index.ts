import { z } from "zod";
import { roundDecimal } from "@/lib/decimal";
import { formatCatalogModelName } from "@/lib/model-name";
import { UNITS } from "@/types/enums";

export const positiveNumber = z
  .number()
  .positive("Must be greater than 0")
  .transform(roundDecimal);
export const positiveInt = z.number().int().positive("Must be greater than 0");

export const coercedPositiveNumber = z.coerce
  .number()
  .positive("Must be greater than 0")
  .transform(roundDecimal);
export const coercedPositiveInt = z.coerce.number().int().positive("Must be greater than 0");

const emptyToUndefined = (val: unknown) => {
  if (val === "" || val === null || val === undefined) return undefined;
  // react-hook-form valueAsNumber turns empty number inputs into NaN
  if (typeof val === "number" && Number.isNaN(val)) return undefined;
  return val;
};

/** Optional money/qty field: blank stays undefined; when set must be > 0. */
export const optionalCoercedPositiveNumber = z.preprocess(
  emptyToUndefined,
  coercedPositiveNumber.optional()
);

export const optionalSupplierId = z.preprocess(
  emptyToUndefined,
  z.string().min(1).max(64).optional()
);

export const optionalInvoiceNumber = z.preprocess(
  emptyToUndefined,
  z.string().min(1).max(100).optional()
);

export const unitSchema = z.enum(UNITS);

export const createBoardSchema = z.object({
  materialName: z.string().min(1, "Material name is required").max(200),
});

export const updateBoardSchema = createBoardSchema;

export const createBoardThicknessSchema = z.object({
  boardId: z.string().min(1).max(64),
  thickness: z.string().min(1, "Thickness is required").max(100),
});

export const updateBoardThicknessSchema = z.object({
  thickness: z.string().min(1, "Thickness is required").max(100),
});

export const createSupplierSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  contactNumber: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  gstNumber: z.string().max(50).optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" }
);

export const createBoardInventorySchema = z.object({
  boardThicknessId: z.string().min(1).max(64),
  purchaseSqft: coercedPositiveNumber,
  purchaseDate: z.coerce.date(),
  supplierId: optionalSupplierId,
  rate: optionalCoercedPositiveNumber,
});

export const updateBoardInventorySchema = z.object({
  supplierId: optionalSupplierId,
  purchaseDate: z.coerce.date().optional(),
  rate: optionalCoercedPositiveNumber,
  purchaseSqft: coercedPositiveNumber.optional(),
});

export const createMaterialProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  unit: unitSchema,
});

export const updateMaterialProductSchema = createMaterialProductSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" }
);

export const createMaterialPurchaseSchema = z.object({
  productId: z.string().min(1, "Product is required").max(64),
  supplierId: optionalSupplierId,
  invoiceNumber: optionalInvoiceNumber,
  quantity: coercedPositiveNumber,
  rate: optionalCoercedPositiveNumber,
  purchaseDate: z.coerce.date(),
  remarks: z.string().max(2000).optional(),
});

export const updateMaterialPurchaseSchema = createMaterialPurchaseSchema
  .partial()
  .omit({ productId: true })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const createCatalogProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
});

export const updateCatalogProductSchema = createCatalogProductSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" }
);

const catalogModelPresetIdsSchema = z.object({
  boardThicknessIds: z.array(z.string().min(1)).max(50).optional().default([]),
  paintProductIds: z.array(z.string().min(1)).max(50).optional().default([]),
  hardwareProductIds: z.array(z.string().min(1)).max(50).optional().default([]),
  packingProductIds: z.array(z.string().min(1)).max(50).optional().default([]),
});

const catalogModelFieldsSchema = z
  .object({
    modelNumber: z.string().min(1, "Model number is required").max(50),
    size: z.string().min(1, "Size is required").max(100),
    partCount: positiveInt.max(26, "Max 26 parts"),
  })
  .merge(catalogModelPresetIdsSchema);

function toCatalogModelWrite(data: z.infer<typeof catalogModelFieldsSchema>) {
  return {
    modelName: formatCatalogModelName(data.modelNumber, data.size),
    partCount: data.partCount,
    boardThicknessIds: [...new Set(data.boardThicknessIds)],
    paintProductIds: [...new Set(data.paintProductIds)],
    hardwareProductIds: [...new Set(data.hardwareProductIds)],
    packingProductIds: [...new Set(data.packingProductIds)],
  };
}

export const createCatalogProductModelSchema =
  catalogModelFieldsSchema.transform(toCatalogModelWrite);

export const updateCatalogProductModelSchema =
  catalogModelFieldsSchema.transform(toCatalogModelWrite);

export const materialListQuerySchema = z.object({
  page: coercedPositiveInt.optional().default(1),
  limit: coercedPositiveInt.max(100).optional().default(15),
  search: z.string().max(200).optional().default(""),
  productId: z.string().max(64).optional(),
  activeOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});

export type UpdateBoardInventoryInput = z.infer<typeof updateBoardInventorySchema>;
export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
export type CreateBoardThicknessInput = z.infer<typeof createBoardThicknessSchema>;
export type UpdateBoardThicknessInput = z.infer<typeof updateBoardThicknessSchema>;
export type CreateBoardInventoryInput = z.infer<typeof createBoardInventorySchema>;
export type CreateMaterialProductInput = z.infer<typeof createMaterialProductSchema>;
export type UpdateMaterialProductInput = z.infer<typeof updateMaterialProductSchema>;
export type CreateMaterialPurchaseInput = z.infer<typeof createMaterialPurchaseSchema>;
export type UpdateMaterialPurchaseInput = z.infer<typeof updateMaterialPurchaseSchema>;
export type MaterialListQuery = z.infer<typeof materialListQuerySchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type CreateCatalogProductInput = z.infer<typeof createCatalogProductSchema>;
export type UpdateCatalogProductInput = z.infer<typeof updateCatalogProductSchema>;
export type CreateCatalogProductModelInput = z.input<typeof createCatalogProductModelSchema>;
export type UpdateCatalogProductModelInput = z.input<typeof updateCatalogProductModelSchema>;
export type CatalogProductModelWrite = z.output<typeof createCatalogProductModelSchema>;
