import { prisma } from "@/lib/prisma";
import { mapWorkerEntry, mapWorkerRates } from "@/lib/worker-labor";
import type { LotWorkerEntryDto, LotWorkerRatesDto } from "@/types/dto";
import type {
  CreateLotWorkerEntryInput,
  UpdateLotWorkerEntryInput,
  UpdateLotWorkerRatesInput,
} from "@/validators/manufacturing";

async function assertLotEditable(lotId: string) {
  const lot = await prisma.manufacturingLot.findUnique({ where: { id: lotId } });
  if (!lot) throw new Error("Lot not found");
  return lot;
}

export class LotWorkerRepository {
  async findRates(lotId: string): Promise<LotWorkerRatesDto> {
    const row = await prisma.lotWorkerRates.findUnique({ where: { lotId } });
    return mapWorkerRates(row);
  }

  async upsertRates(lotId: string, data: UpdateLotWorkerRatesInput): Promise<LotWorkerRatesDto> {
    await assertLotEditable(lotId);
    const row = await prisma.lotWorkerRates.upsert({
      where: { lotId },
      create: { lotId, ...data },
      update: data,
    });
    return mapWorkerRates(row);
  }

  async findEntries(lotId: string): Promise<LotWorkerEntryDto[]> {
    const rows = await prisma.lotWorkerEntry.findMany({
      where: { lotId },
      orderBy: [{ workDate: "desc" }, { createdAt: "desc" }],
    });
    return rows.map(mapWorkerEntry);
  }

  async createEntry(lotId: string, data: CreateLotWorkerEntryInput): Promise<LotWorkerEntryDto> {
    await assertLotEditable(lotId);

    const row = await prisma.lotWorkerEntry.create({
      data: {
        lotId,
        type: data.type,
        workDate: data.workDate,
        workerNames: data.workerNames.map((n) => n.trim()).filter(Boolean),
        machinery: data.machinery?.trim() || null,
        mistri: data.mistri,
        halfMistri: data.halfMistri,
        helper: data.helper,
        hours: data.hours,
        packQty: data.type === "PACKING" ? (data.packQty ?? null) : null,
      },
    });
    return mapWorkerEntry(row);
  }

  async updateEntry(
    entryId: string,
    data: UpdateLotWorkerEntryInput
  ): Promise<LotWorkerEntryDto> {
    const existing = await prisma.lotWorkerEntry.findUnique({
      where: { id: entryId },
      include: { lot: true },
    });
    if (!existing) throw new Error("Entry not found");

    const type = data.type ?? existing.type;

    const row = await prisma.lotWorkerEntry.update({
      where: { id: entryId },
      data: {
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.workDate !== undefined ? { workDate: data.workDate } : {}),
        ...(data.workerNames !== undefined
          ? { workerNames: data.workerNames.map((n) => n.trim()).filter(Boolean) }
          : {}),
        ...(data.machinery !== undefined ? { machinery: data.machinery?.trim() || null } : {}),
        ...(data.mistri !== undefined ? { mistri: data.mistri } : {}),
        ...(data.halfMistri !== undefined ? { halfMistri: data.halfMistri } : {}),
        ...(data.helper !== undefined ? { helper: data.helper } : {}),
        ...(data.hours !== undefined ? { hours: data.hours } : {}),
        packQty: type === "PACKING" ? (data.packQty ?? existing.packQty) : null,
      },
    });
    return mapWorkerEntry(row);
  }

  async deleteEntry(entryId: string): Promise<void> {
    const existing = await prisma.lotWorkerEntry.findUnique({
      where: { id: entryId },
      include: { lot: true },
    });
    if (!existing) throw new Error("Entry not found");

    await prisma.lotWorkerEntry.delete({ where: { id: entryId } });
  }
}

export const lotWorkerRepository = new LotWorkerRepository();
