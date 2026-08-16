import { z } from "zod";
import { positiveInt } from "@/validators/inventory";

const productionStageEnum = z.enum([
  "CARPENTRY",
  "FOR_PAINT",
  "IN_PAINT",
  "IN_STOCK",
  "READY",
]);

const workDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

const nonNegInt = z.number().int().min(0).max(1_000_000);

const productionProgressFields = z.object({
  carpentryQty: positiveInt,
  paintingReadyQty: nonNegInt,
  paintingStatusQty: nonNegInt,
  completedReadyQty: nonNegInt,
  completedOutQty: nonNegInt,
});

function refineProgressOrder(
  data: {
    carpentryQty: number;
    paintingReadyQty: number;
    paintingStatusQty: number;
    completedReadyQty: number;
    completedOutQty: number;
  },
  ctx: z.RefinementCtx
) {
  if (data.paintingReadyQty + data.completedReadyQty > data.carpentryQty) {
    ctx.addIssue({
      code: "custom",
      path: ["paintingReadyQty"],
      message: "Paint remaining plus Done cannot exceed Initial Qty",
    });
  }
  if (data.paintingStatusQty > data.paintingReadyQty) {
    ctx.addIssue({
      code: "custom",
      path: ["paintingStatusQty"],
      message: "Paint Status cannot exceed Paint Ready",
    });
  }
  if (data.completedOutQty > data.completedReadyQty) {
    ctx.addIssue({
      code: "custom",
      path: ["completedOutQty"],
      message: "Done Out cannot exceed Done Ready",
    });
  }
}

export const createProductionEntrySchema = z
  .object({
    lotId: z.string().min(1).max(64),
    manufacturingModelId: z.string().min(1).max(64),
    parts: z.array(z.string().min(1).max(8)).min(1, "Select at least one part").max(26),
    details: z.string().min(1, "Details are required").max(2000),
    statusText: z.string().max(500).optional(),
    description: z.string().max(2000).optional(),
    workDate: workDateSchema,
    stage: productionStageEnum.default("CARPENTRY"),
  })
  .merge(productionProgressFields)
  .superRefine(refineProgressOrder);

export const updateProductionEntrySchema = z
  .object({
    details: z.string().min(1).max(2000).optional(),
    statusText: z.string().max(500).nullable().optional(),
    description: z.string().max(2000).nullable().optional(),
    parts: z.array(z.string().min(1).max(8)).min(1).max(26).optional(),
    workDate: workDateSchema.optional(),
    stage: productionStageEnum.optional(),
    carpentryQty: positiveInt.optional(),
    paintingReadyQty: nonNegInt.optional(),
    paintingStatusQty: nonNegInt.optional(),
    completedReadyQty: nonNegInt.optional(),
    completedOutQty: nonNegInt.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const productionListQuerySchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("date"),
    date: workDateSchema,
  }),
  z.object({
    mode: z.literal("lot"),
    lotId: z.string().min(1).max(64),
  }),
  z.object({
    mode: z.literal("model"),
    catalogModelId: z.string().min(1).max(64),
  }),
]);

export type CreateProductionEntryInput = z.infer<typeof createProductionEntrySchema>;
export type UpdateProductionEntryInput = z.infer<typeof updateProductionEntrySchema>;
export type ProductionListQuery = z.infer<typeof productionListQuerySchema>;
