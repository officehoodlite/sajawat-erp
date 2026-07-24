import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/mappers";
import { groupBoardUsage } from "@/utils/board-calculations";
import { computeBoardWastage } from "@/utils/board-wastage";
import type {
  BoardUsageSummaryDto,
  BoardWastageSummaryDto,
  LotActualBoardEntryDto,
} from "@/types/dto";
import type { CreateLotActualBoardEntryInput } from "@/validators/manufacturing";

const entryInclude = {
  boardThickness: { include: { board: true } },
} as const;

type EntryRow = {
  id: string;
  lotId: string;
  boardThicknessId: string;
  length: unknown;
  width: unknown;
  quantity: number;
  sqftIn: unknown;
  sqftOut: unknown;
  totalSqft: unknown;
  boardThickness: {
    thickness: string;
    board: { materialName: string };
  };
};

function mapEntry(row: EntryRow): LotActualBoardEntryDto {
  return {
    id: row.id,
    lotId: row.lotId,
    boardThicknessId: row.boardThicknessId,
    materialName: row.boardThickness.board.materialName,
    thickness: row.boardThickness.thickness,
    length: toNumber(row.length),
    width: toNumber(row.width),
    quantity: row.quantity,
    sqftIn: toNumber(row.sqftIn),
    sqftOut: toNumber(row.sqftOut),
    totalSqft: toNumber(row.totalSqft),
  };
}

export function groupActualBoardUsage(
  entries: LotActualBoardEntryDto[]
): BoardUsageSummaryDto[] {
  return groupBoardUsage(
    entries.map((e) => ({
      materialName: e.materialName,
      thickness: e.thickness,
      totalSqft: e.totalSqft,
    }))
  );
}

export function buildBoardWastageSummary(
  calculated: BoardUsageSummaryDto[],
  actual: BoardUsageSummaryDto[]
): BoardWastageSummaryDto[] {
  return computeBoardWastage(calculated, actual);
}

export class LotActualBoardRepository {
  async findByLotId(lotId: string): Promise<LotActualBoardEntryDto[]> {
    const rows = await prisma.lotActualBoardEntry.findMany({
      where: { lotId },
      include: entryInclude,
      orderBy: { createdAt: "asc" },
    });
    return rows.map(mapEntry);
  }

  async findById(id: string): Promise<LotActualBoardEntryDto | null> {
    const row = await prisma.lotActualBoardEntry.findUnique({
      where: { id },
      include: entryInclude,
    });
    return row ? mapEntry(row) : null;
  }

  async create(lotId: string, data: CreateLotActualBoardEntryInput & { totalSqft: number }) {
    const row = await prisma.lotActualBoardEntry.create({
      data: {
        lotId,
        boardThicknessId: data.boardThicknessId,
        length: data.length,
        width: data.width,
        quantity: data.quantity,
        sqftIn: data.sqftIn,
        sqftOut: data.sqftOut,
        totalSqft: data.totalSqft,
      },
      include: entryInclude,
    });
    return mapEntry(row);
  }

  async update(
    id: string,
    data: Partial<CreateLotActualBoardEntryInput> & { totalSqft?: number }
  ) {
    const row = await prisma.lotActualBoardEntry.update({
      where: { id },
      data,
      include: entryInclude,
    });
    return mapEntry(row);
  }

  async delete(id: string) {
    return prisma.lotActualBoardEntry.delete({ where: { id } });
  }

  async sumByThickness(lotId: string): Promise<Map<string, number>> {
    const rows = await prisma.lotActualBoardEntry.groupBy({
      by: ["boardThicknessId"],
      where: { lotId },
      _sum: { totalSqft: true },
    });
    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.boardThicknessId, toNumber(row._sum.totalSqft));
    }
    return map;
  }
}

export const lotActualBoardRepository = new LotActualBoardRepository();
