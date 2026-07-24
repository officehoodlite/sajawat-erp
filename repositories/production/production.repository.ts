import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { partLabels } from "@/lib/production-parts";
import {
  formatWorkDateInput,
  parseWorkDate,
  progressDisplay,
  workDateDayRange,
} from "@/lib/production-stage";
import type {
  ProductionEntryDto,
  ProductionLotModelDto,
  ProductionSuggestionsDto,
} from "@/types/dto";
import type { ProductionStage } from "@/types/enums";
import type {
  CreateProductionEntryInput,
  ProductionListQuery,
  UpdateProductionEntryInput,
} from "@/validators/production";

type DbClient = Prisma.TransactionClient | typeof prisma;

type EntryRow = {
  id: string;
  lotId: string;
  manufacturingModelId: string;
  parts: string[];
  details: string;
  statusText: string | null;
  description: string | null;
  stage: ProductionStage;
  workDate: Date;
  carpentryQty: number;
  paintingReadyQty: number;
  paintingStatusQty: number;
  completedReadyQty: number;
  completedOutQty: number;
  createdAt: Date;
  updatedAt: Date;
  lot: { lotNumber: string };
  manufacturingModel: {
    modelName: string;
    quantity: number;
    partCount: number;
    catalogModelId: string;
    product: { name: string };
  };
};

function mapEntry(row: EntryRow): ProductionEntryDto {
  const display = progressDisplay({
    carpentryQty: row.carpentryQty,
    paintingReadyQty: row.paintingReadyQty,
    paintingStatusQty: row.paintingStatusQty,
    completedReadyQty: row.completedReadyQty,
    completedOutQty: row.completedOutQty,
  });

  return {
    id: row.id,
    lotId: row.lotId,
    lotNumber: row.lot.lotNumber,
    manufacturingModelId: row.manufacturingModelId,
    modelName: row.manufacturingModel.modelName,
    productName: row.manufacturingModel.product.name,
    catalogModelId: row.manufacturingModel.catalogModelId,
    modelQuantity: row.manufacturingModel.quantity,
    partCount: row.manufacturingModel.partCount,
    parts: row.parts,
    details: row.details,
    statusText: row.statusText,
    description: row.description,
    stage: row.stage,
    workDate: formatWorkDateInput(row.workDate),
    quantity: display.quantity,
    carpentryQty: display.carpentryQty,
    paintingReadyQty: display.paintingReady,
    paintingStatusQty: display.paintingStatusQty,
    completedReadyQty: display.completedReady,
    completedOutQty: display.completedOutQty,
    paintingReady: display.paintingReady,
    paintingBalance: display.paintingBalance,
    completedReady: display.completedReady,
    completedBalance: display.completedBalance,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const entryInclude = {
  lot: { select: { lotNumber: true } },
  manufacturingModel: {
    select: {
      modelName: true,
      quantity: true,
      partCount: true,
      catalogModelId: true,
      product: { select: { name: true } },
    },
  },
} as const;

/** Active lines: Done Out has not yet reached Initial Qty. */
function isActiveEntry(row: { carpentryQty: number; completedOutQty: number }) {
  return row.completedOutQty < row.carpentryQty;
}

async function remainingCapacityByPart(
  db: DbClient,
  modelId: string,
  modelQuantity: number,
  partCount: number,
  excludeEntryId?: string
) {
  const labels = partLabels(partCount);
  const entries = await db.productionEntry.findMany({
    where: {
      manufacturingModelId: modelId,
      ...(excludeEntryId ? { id: { not: excludeEntryId } } : {}),
    },
    select: { parts: true, carpentryQty: true },
  });

  const usedByPart = new Map<string, number>();
  for (const label of labels) usedByPart.set(label, 0);

  for (const entry of entries) {
    for (const part of entry.parts) {
      if (!usedByPart.has(part)) continue;
      usedByPart.set(part, (usedByPart.get(part) ?? 0) + entry.carpentryQty);
    }
  }

  return labels.map((part) => ({
    part,
    remaining: Math.max(0, modelQuantity - (usedByPart.get(part) ?? 0)),
  }));
}

function assertProgressOrder(values: {
  carpentryQty: number;
  paintingReadyQty: number;
  paintingStatusQty: number;
  completedReadyQty: number;
  completedOutQty: number;
}) {
  if (values.paintingReadyQty > values.carpentryQty) {
    throw new Error("Paint Ready cannot exceed Initial Qty");
  }
  if (values.paintingStatusQty > values.paintingReadyQty) {
    throw new Error("Paint Status cannot exceed Paint Ready");
  }
  if (values.completedReadyQty > values.paintingStatusQty) {
    throw new Error("Done Ready cannot exceed Paint Status");
  }
  if (values.completedOutQty > values.completedReadyQty) {
    throw new Error("Done Out cannot exceed Done Ready");
  }
}

async function assertPartCapacity(
  db: DbClient,
  modelId: string,
  modelQuantity: number,
  partCount: number,
  parts: string[],
  carpentryQty: number,
  excludeEntryId?: string
) {
  const uniqueParts = [...new Set(parts)];
  if (uniqueParts.length !== parts.length) {
    throw new Error("Duplicate parts are not allowed");
  }

  const allowed = partLabels(partCount);
  const invalid = uniqueParts.filter((p) => !allowed.includes(p));
  if (invalid.length > 0) throw new Error(`Invalid parts: ${invalid.join(", ")}`);

  const remaining = await remainingCapacityByPart(
    db,
    modelId,
    modelQuantity,
    partCount,
    excludeEntryId
  );
  const byPart = new Map(remaining.map((r) => [r.part, r.remaining]));

  for (const part of uniqueParts) {
    const rem = byPart.get(part) ?? 0;
    if (carpentryQty > rem) {
      throw new Error(`${part} quantity exceeds remaining capacity (${rem})`);
    }
  }

  return uniqueParts;
}

export class ProductionRepository {
  async list(query: ProductionListQuery): Promise<ProductionEntryDto[]> {
    if (query.mode === "date") {
      const { gte, lt } = workDateDayRange(query.date);
      const rows = await prisma.productionEntry.findMany({
        where: { workDate: { gte, lt } },
        include: entryInclude,
        orderBy: [{ createdAt: "desc" }],
      });
      return rows.filter(isActiveEntry).map(mapEntry);
    }

    if (query.mode === "lot") {
      const rows = await prisma.productionEntry.findMany({
        where: { lotId: query.lotId },
        include: entryInclude,
        orderBy: [{ workDate: "desc" }, { createdAt: "desc" }],
      });
      return rows.filter(isActiveEntry).map(mapEntry);
    }

    const rows = await prisma.productionEntry.findMany({
      where: { manufacturingModel: { catalogModelId: query.catalogModelId } },
      include: entryInclude,
      orderBy: [{ workDate: "desc" }, { createdAt: "desc" }],
    });
    return rows.filter(isActiveEntry).map(mapEntry);
  }

  async findByWorkDate(dateStr: string): Promise<ProductionEntryDto[]> {
    return this.list({ mode: "date", date: dateStr });
  }

  async findById(id: string): Promise<ProductionEntryDto | null> {
    const row = await prisma.productionEntry.findUnique({
      where: { id },
      include: entryInclude,
    });
    return row ? mapEntry(row) : null;
  }

  async findLotModels(lotId: string): Promise<ProductionLotModelDto[]> {
    const models = await prisma.manufacturingModel.findMany({
      where: { lotId },
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    });

    const result: ProductionLotModelDto[] = [];
    for (const model of models) {
      const byPart = await remainingCapacityByPart(
        prisma,
        model.id,
        model.quantity,
        model.partCount
      );
      const minRemaining = byPart.reduce(
        (min, row) => Math.min(min, row.remaining),
        model.quantity
      );
      result.push({
        id: model.id,
        modelName: model.modelName,
        productName: model.product.name,
        catalogModelId: model.catalogModelId,
        quantity: model.quantity,
        partCount: model.partCount,
        partOptions: partLabels(model.partCount),
        remainingCapacity: minRemaining,
        remainingCapacityByPart: byPart,
      });
    }
    return result;
  }

  async findLotByNumber(lotNumber: string) {
    return prisma.manufacturingLot.findUnique({
      where: { lotNumber },
      select: { id: true, lotNumber: true },
    });
  }

  async getSuggestions(): Promise<ProductionSuggestionsDto> {
    const [detailsRows, statusRows] = await Promise.all([
      prisma.productionEntry.findMany({
        where: { details: { not: "" } },
        select: { details: true },
        distinct: ["details"],
        orderBy: { details: "asc" },
        take: 100,
      }),
      prisma.productionEntry.findMany({
        where: { statusText: { not: null } },
        select: { statusText: true },
        distinct: ["statusText"],
        orderBy: { statusText: "asc" },
        take: 100,
      }),
    ]);

    return {
      details: detailsRows.map((r) => r.details).filter(Boolean),
      statuses: statusRows
        .map((r) => r.statusText)
        .filter((s): s is string => !!s && s.trim().length > 0),
    };
  }

  async create(data: CreateProductionEntryInput): Promise<ProductionEntryDto> {
    return prisma.$transaction(async (tx) => {
      const model = await tx.manufacturingModel.findFirst({
        where: { id: data.manufacturingModelId, lotId: data.lotId },
      });
      if (!model) throw new Error("Model not found in this lot");

      const progress = {
        carpentryQty: data.carpentryQty,
        paintingReadyQty: data.paintingReadyQty,
        paintingStatusQty: data.paintingStatusQty,
        completedReadyQty: data.completedReadyQty,
        completedOutQty: data.completedOutQty,
      };
      assertProgressOrder(progress);

      const parts = await assertPartCapacity(
        tx,
        model.id,
        model.quantity,
        model.partCount,
        data.parts,
        data.carpentryQty
      );

      const row = await tx.productionEntry.create({
        data: {
          lotId: data.lotId,
          manufacturingModelId: data.manufacturingModelId,
          parts,
          details: data.details.trim(),
          statusText: data.statusText?.trim() || null,
          description: data.description?.trim() || null,
          workDate: parseWorkDate(data.workDate),
          stage: data.stage ?? "CARPENTRY",
          ...progress,
        },
        include: entryInclude,
      });

      return mapEntry(row);
    });
  }

  async update(id: string, data: UpdateProductionEntryInput): Promise<ProductionEntryDto> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.productionEntry.findUnique({
        where: { id },
        include: { manufacturingModel: true },
      });
      if (!existing) throw new Error("Production entry not found");

      const nextParts = data.parts ?? existing.parts;
      const nextProgress = {
        carpentryQty: data.carpentryQty ?? existing.carpentryQty,
        paintingReadyQty: data.paintingReadyQty ?? existing.paintingReadyQty,
        paintingStatusQty: data.paintingStatusQty ?? existing.paintingStatusQty,
        completedReadyQty: data.completedReadyQty ?? existing.completedReadyQty,
        completedOutQty: data.completedOutQty ?? existing.completedOutQty,
      };

      const quantityTouched =
        data.carpentryQty !== undefined ||
        data.paintingReadyQty !== undefined ||
        data.paintingStatusQty !== undefined ||
        data.completedReadyQty !== undefined ||
        data.completedOutQty !== undefined;

      if (quantityTouched || data.parts !== undefined) {
        assertProgressOrder(nextProgress);
        await assertPartCapacity(
          tx,
          existing.manufacturingModelId,
          existing.manufacturingModel.quantity,
          existing.manufacturingModel.partCount,
          nextParts,
          nextProgress.carpentryQty,
          id
        );
      }

      const uniqueParts =
        data.parts !== undefined ? [...new Set(data.parts)] : undefined;

      const row = await tx.productionEntry.update({
        where: { id },
        data: {
          ...(uniqueParts !== undefined ? { parts: uniqueParts } : {}),
          ...(data.details !== undefined ? { details: data.details.trim() } : {}),
          ...(data.statusText !== undefined
            ? { statusText: data.statusText?.trim() || null }
            : {}),
          ...(data.description !== undefined
            ? { description: data.description?.trim() || null }
            : {}),
          ...(data.workDate !== undefined ? { workDate: parseWorkDate(data.workDate) } : {}),
          // Stage-only updates never rewrite quantity columns.
          ...(data.stage !== undefined ? { stage: data.stage } : {}),
          ...(quantityTouched ? nextProgress : {}),
        },
        include: entryInclude,
      });

      return mapEntry(row);
    });
  }

  async delete(id: string): Promise<void> {
    const existing = await prisma.productionEntry.findUnique({ where: { id } });
    if (!existing) throw new Error("Production entry not found");
    await prisma.productionEntry.delete({ where: { id } });
  }
}

export const productionRepository = new ProductionRepository();
