import { prisma } from "@/lib/prisma";
import { roundDecimal } from "@/lib/decimal";
import { mapBoardInventory, mapBoardOption, toNullableNumber, toNumber } from "@/lib/mappers";
import {
  assertDeleteAllowed,
  assertQuantityEditAllowed,
  computeConsumed,
} from "@/lib/purchase-integrity";
import { formatNumber } from "@/utils/format";
import type {
  BoardConsumptionDto,
  BoardPurchaseDto,
  BoardStockDto,
} from "@/types/dto";
import type { CreateBoardInput, CreateBoardInventoryInput, CreateBoardThicknessInput, UpdateBoardInventoryInput } from "@/validators/inventory";

interface BoardListQuery {
  page: number;
  limit: number;
  search: string;
}

export class BoardRepository {
  async findAllMaterials() {
    return prisma.board.findMany({
      include: { _count: { select: { thicknesses: true } } },
      orderBy: { materialName: "asc" },
    });
  }

  async findMaterialsPaginated(query: BoardListQuery) {
    const where = query.search.trim()
      ? { materialName: { contains: query.search.trim(), mode: "insensitive" as const } }
      : {};
    const skip = (query.page - 1) * query.limit;

    const [rows, total] = await Promise.all([
      prisma.board.findMany({
        where,
        include: { _count: { select: { thicknesses: true } } },
        orderBy: { materialName: "asc" },
        skip,
        take: query.limit,
      }),
      prisma.board.count({ where }),
    ]);

    return {
      items: rows.map((b) => ({
        id: b.id,
        materialName: b.materialName,
        thicknessCount: b._count.thicknesses,
      })),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  async findStockAggregated(): Promise<BoardStockDto[]> {
    const rows = await prisma.boardThickness.findMany({
      include: {
        board: true,
        inventories: { select: { remainingSqft: true } },
      },
      orderBy: [{ board: { materialName: "asc" } }, { thickness: "asc" }],
    });

    return rows.map((row) => ({
      id: row.id,
      materialName: row.board.materialName,
      thickness: row.thickness,
      remainingSqft: row.inventories.reduce(
        (sum, inventory) => sum + toNumber(inventory.remainingSqft),
        0
      ),
    }));
  }

  async findPurchasesPaginated(query: BoardListQuery) {
    const searchFilter = query.search.trim()
      ? {
          OR: [
            { supplier: { name: { contains: query.search.trim(), mode: "insensitive" as const } } },
            {
              boardThickness: {
                board: {
                  materialName: { contains: query.search.trim(), mode: "insensitive" as const },
                },
              },
            },
            {
              boardThickness: {
                thickness: { contains: query.search.trim(), mode: "insensitive" as const },
              },
            },
          ],
        }
      : {};

    const skip = (query.page - 1) * query.limit;

    const [rows, total] = await Promise.all([
      prisma.boardInventory.findMany({
        where: searchFilter,
        include: {
          boardThickness: { include: { board: true } },
          supplier: true,
        },
        orderBy: { purchaseDate: "desc" },
        skip,
        take: query.limit,
      }),
      prisma.boardInventory.count({ where: searchFilter }),
    ]);

    const items: BoardPurchaseDto[] = rows.map((row) => {
      const quantity = toNumber(row.purchaseSqft);
      const remainingQuantity = toNumber(row.remainingSqft);
      const rate = toNullableNumber(row.rate);
      return {
        id: row.id,
        boardThicknessId: row.boardThicknessId,
        materialName: row.boardThickness.board.materialName,
        thickness: row.boardThickness.thickness,
        supplierId: row.supplierId,
        supplierName: row.supplier?.name ?? null,
        quantity,
        remainingQuantity,
        consumedQuantity: computeConsumed(quantity, remainingQuantity),
        rate,
        totalCost: rate != null ? quantity * rate : null,
        purchaseDate: row.purchaseDate.toISOString(),
        createdAt: row.createdAt.toISOString(),
      };
    });

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  async findConsumptionPaginated(query: BoardListQuery) {
    const searchFilter = query.search.trim()
      ? {
          OR: [
            {
              lot: {
                lotNumber: { contains: query.search.trim(), mode: "insensitive" as const },
              },
            },
            {
              boardThickness: {
                board: {
                  materialName: { contains: query.search.trim(), mode: "insensitive" as const },
                },
              },
            },
            {
              boardThickness: {
                thickness: { contains: query.search.trim(), mode: "insensitive" as const },
              },
            },
          ],
        }
      : {};

    const where = searchFilter;
    const skip = (query.page - 1) * query.limit;

    const [rows, total] = await Promise.all([
      prisma.lotActualBoardEntry.findMany({
        where,
        include: {
          boardThickness: { include: { board: true } },
          lot: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
      }),
      prisma.lotActualBoardEntry.count({ where }),
    ]);

    const items: BoardConsumptionDto[] = rows.map((row) => ({
      id: row.id,
      materialName: row.boardThickness.board.materialName,
      thickness: row.boardThickness.thickness,
      lotId: row.lotId,
      lotNumber: row.lot.lotNumber,
      modelId: row.lotId,
      modelName: `${formatNumber(toNumber(row.length))}×${formatNumber(toNumber(row.width))} ×${row.quantity}, ${formatNumber(toNumber(row.sqftIn))} in / ${formatNumber(toNumber(row.sqftOut))} out`,
      quantity: toNumber(row.totalSqft),
      consumedAt: row.lot.updatedAt.toISOString(),
    }));

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  async createMaterial(data: CreateBoardInput) {
    return prisma.board.create({ data });
  }

  async updateMaterial(id: string, data: { materialName: string }) {
    return prisma.board.update({
      where: { id },
      data: { materialName: data.materialName.trim() },
    });
  }

  async deleteMaterial(id: string) {
    return prisma.board.delete({ where: { id } });
  }

  async findThicknessesByBoard(boardId: string) {
    return prisma.boardThickness.findMany({
      where: { boardId },
      include: { board: true },
      orderBy: { thickness: "asc" },
    });
  }

  async createThickness(data: CreateBoardThicknessInput) {
    return prisma.boardThickness.create({ data });
  }

  async updateThickness(id: string, data: { thickness: string }) {
    const existing = await prisma.boardThickness.findUnique({ where: { id } });
    if (!existing) throw new Error("Thickness not found");

    return prisma.boardThickness.update({
      where: { id },
      data: { thickness: data.thickness.trim() },
    });
  }

  async deleteThickness(id: string) {
    return prisma.boardThickness.delete({ where: { id } });
  }

  async findInventories(boardThicknessId?: string) {
    const rows = await prisma.boardInventory.findMany({
      where: boardThicknessId ? { boardThicknessId } : undefined,
      include: {
        boardThickness: { include: { board: true } },
        supplier: true,
      },
      orderBy: { purchaseDate: "desc" },
    });
    return rows.map(mapBoardInventory);
  }

  async findInventoryById(id: string) {
    const row = await prisma.boardInventory.findUnique({
      where: { id },
      include: {
        boardThickness: { include: { board: true } },
        supplier: true,
      },
    });
    return row ? mapBoardInventory(row) : null;
  }

  async createInventory(data: CreateBoardInventoryInput) {
    const row = await prisma.boardInventory.create({
      data: {
        boardThicknessId: data.boardThicknessId,
        purchaseSqft: data.purchaseSqft,
        remainingSqft: data.purchaseSqft,
        purchaseDate: data.purchaseDate,
        supplierId: data.supplierId ?? null,
        rate: data.rate ?? null,
      },
      include: {
        boardThickness: { include: { board: true } },
        supplier: true,
      },
    });
    return mapBoardInventory(row);
  }

  async updateInventory(id: string, data: UpdateBoardInventoryInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.boardInventory.findUnique({ where: { id } });
      if (!existing) throw new Error("Inventory not found");

      const oldPurchaseSqft = toNumber(existing.purchaseSqft);
      const remainingSqft = toNumber(existing.remainingSqft);
      const consumed = computeConsumed(oldPurchaseSqft, remainingSqft);

      const updateData: {
        supplierId?: string | null;
        purchaseDate?: Date;
        rate?: number | null;
        purchaseSqft?: number;
        remainingSqft?: number;
      } = {};

      if (data.supplierId !== undefined) updateData.supplierId = data.supplierId ?? null;
      if (data.purchaseDate !== undefined) updateData.purchaseDate = data.purchaseDate;
      if (data.rate !== undefined) updateData.rate = data.rate ?? null;

      if (data.purchaseSqft !== undefined) {
        const newPurchaseSqft = roundDecimal(data.purchaseSqft);
        assertQuantityEditAllowed(oldPurchaseSqft, remainingSqft, newPurchaseSqft, "SqFt");
        updateData.purchaseSqft = newPurchaseSqft;
        updateData.remainingSqft = roundDecimal(newPurchaseSqft - consumed);
      }

      const row = await tx.boardInventory.update({
        where: { id },
        data: updateData,
        include: {
          boardThickness: { include: { board: true } },
          supplier: true,
        },
      });
      return mapBoardInventory(row);
    });
  }

  async deleteInventory(id: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.boardInventory.findUnique({ where: { id } });
      if (!existing) throw new Error("Inventory not found");

      const purchaseSqft = toNumber(existing.purchaseSqft);
      const remainingSqft = toNumber(existing.remainingSqft);
      const consumed = computeConsumed(purchaseSqft, remainingSqft);
      assertDeleteAllowed(consumed);

      const referenced = await tx.manufacturingBoardEntry.count({
        where: { boardInventoryId: id },
      });
      if (referenced > 0) {
        throw new Error(
          "Cannot delete this purchase because it is referenced by manufacturing board entries."
        );
      }

      await tx.boardInventory.delete({ where: { id } });
    });
  }

  async findBoardOptions() {
    const rows = await prisma.boardInventory.findMany({
      where: { remainingSqft: { gt: 0 } },
      include: {
        boardThickness: { include: { board: true } },
        supplier: true,
      },
      orderBy: [
        { boardThickness: { board: { materialName: "asc" } } },
        { boardThickness: { thickness: "asc" } },
      ],
    });
    return rows.map(mapBoardOption);
  }

  async findAllThicknessOptions() {
    const rows = await prisma.boardThickness.findMany({
      include: { board: true },
      orderBy: [
        { board: { materialName: "asc" } },
        { thickness: "asc" },
      ],
    });
    return rows.map((t) => ({
      id: t.id,
      label: `${t.board.materialName} ${t.thickness}`,
      materialName: t.board.materialName,
      thickness: t.thickness,
    }));
  }

  async getRemainingSqft(id: string) {
    const row = await prisma.boardInventory.findUnique({
      where: { id },
      select: { remainingSqft: true },
    });
    return row ? toNumber(row.remainingSqft) : null;
  }
}

export const boardRepository = new BoardRepository();
