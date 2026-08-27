import { prisma } from "@/lib/prisma";
import { CACHE_KEYS, cacheDel } from "@/lib/redis";
import { roundDecimal } from "@/lib/decimal";
import { totalForModelQty, materialEntryStockQty } from "@/lib/model-consumption";
import {
  adjustMaterialStock,
  applyBoardThicknessNetDelta,
  releaseMaterialStock,
  reserveMaterialStock,
  type MaterialType,
} from "@/lib/manufacturing-stock";
import { toNumber } from "@/lib/mappers";
import { calcActualBoardTotalSqft, calcBoardEntrySqft } from "@/utils/board-calculations";
import { mapLotDetail } from "@/repositories/manufacturing/lot.repository";
import { lotActualBoardRepository } from "@/repositories/manufacturing/lot-actual-board.repository";
import { findLotSummaryById } from "@/repositories/manufacturing/model.repository";
import { lotWorkerRepository } from "@/repositories/manufacturing/lot-worker.repository";
import type { ManufacturingEntryAckDto } from "@/types/dto";
import type {
  CreateBoardEntryInput,
  CreateLotActualBoardEntryInput,
  CreateLotWorkerEntryInput,
  CreateModelInput,
  CreateLotInput,
  UpdateLotInput,
  UpdateLotWorkerEntryInput,
  UpdateLotWorkerRatesInput,
  UpdatePolishLaborInput,
} from "@/validators/manufacturing";

async function invalidateMaterialOptions(type: MaterialType) {
  const key =
    type === "paint"
      ? CACHE_KEYS.paintOptions
      : type === "hardware"
        ? CACHE_KEYS.hardwareOptions
        : type === "packing"
          ? CACHE_KEYS.packingOptions
          : type === "edgebinding"
            ? CACHE_KEYS.edgebindingOptions
            : CACHE_KEYS.glassOptions;
  await cacheDel(key);
}

async function invalidateBoardCaches() {
  await cacheDel(CACHE_KEYS.boardOptions);
}

function modelWriteAck(lotId: string, modelId: string): ManufacturingEntryAckDto {
  return { ok: true, lotId, modelId };
}

const lotInclude = {
  models: {
    orderBy: { createdAt: "asc" as const },
    include: {
      product: true,
      boardEntries: {
        include: {
          boardInventory: {
            include: {
              boardThickness: { include: { board: true } },
            },
          },
        },
      },
      paintEntries: { include: { paintProduct: true } },
      hardwareEntries: { include: { hardwareProduct: true } },
      packingEntries: { include: { packingProduct: true } },
      edgeBindingEntries: { include: { edgeBindingProduct: true } },
      glassEntries: { include: { glassProduct: true } },
      boardPresets: {
        include: { boardThickness: { include: { board: true } } },
        orderBy: { createdAt: "asc" as const },
      },
      paintPresets: {
        include: { paintProduct: true },
        orderBy: { createdAt: "asc" as const },
      },
      hardwarePresets: {
        include: { hardwareProduct: true },
        orderBy: { createdAt: "asc" as const },
      },
      packingPresets: {
        include: { packingProduct: true },
        orderBy: { createdAt: "asc" as const },
      },
      edgeBindingPresets: {
        include: { edgeBindingProduct: true },
        orderBy: { createdAt: "asc" as const },
      },
      glassPresets: {
        include: { glassProduct: true },
        orderBy: { createdAt: "asc" as const },
      },
    },
  },
};

export class ManufacturingService {
  async createLot(input: CreateLotInput) {
    return prisma.manufacturingLot
      .create({
        data: input,
        include: lotInclude,
      })
      .then(mapLotDetail);
  }

  async updateLot(id: string, input: UpdateLotInput) {
    const existing = await prisma.manufacturingLot.findUnique({ where: { id } });
    if (!existing) throw new Error("Lot not found");
    return prisma.manufacturingLot
      .update({
        where: { id },
        data: input,
        include: lotInclude,
      })
      .then(mapLotDetail);
  }

  async deleteLot(id: string) {
    const lot = await prisma.manufacturingLot.findUnique({
      where: { id },
      include: { _count: { select: { models: true } } },
    });
    if (!lot) throw new Error("Lot not found");
    if (lot._count.models > 0) throw new Error("Cannot delete lot with models");
    await prisma.manufacturingLot.delete({ where: { id } });
  }

  async createModel(lotId: string, input: CreateModelInput) {
    const lot = await prisma.manufacturingLot.findUnique({ where: { id: lotId } });
    if (!lot) throw new Error("Lot not found");

    const catalogModel = await prisma.productModel.findFirst({
      where: { id: input.catalogModelId, productId: input.productId },
      include: {
        product: true,
        boardPresets: true,
        paintPresets: true,
        hardwarePresets: true,
        packingPresets: true,
        edgeBindingPresets: true,
        glassPresets: true,
      },
    });
    if (!catalogModel) throw new Error("Catalog model not found for selected product");

    await prisma.$transaction(async (tx) => {
      const model = await tx.manufacturingModel.create({
        data: {
          lotId,
          productId: input.productId,
          catalogModelId: input.catalogModelId,
          modelName: catalogModel.modelName,
          quantity: input.quantity,
          partCount: catalogModel.partCount,
        },
      });

      if (catalogModel.boardPresets.length > 0) {
        await tx.manufacturingModelBoardPreset.createMany({
          data: catalogModel.boardPresets.map((p) => ({
            modelId: model.id,
            boardThicknessId: p.boardThicknessId,
            length: p.length,
            width: p.width,
            quantity: p.quantity,
          })),
        });

        for (const preset of catalogModel.boardPresets) {
          const length = toNumber(preset.length);
          const width = toNumber(preset.width);
          if (length <= 0 || width <= 0 || preset.quantity <= 0) continue;
          const inventories = await tx.boardInventory.findMany({
            where: { boardThicknessId: preset.boardThicknessId },
            select: { id: true },
          });
          if (inventories.length !== 1) continue;
          const { sqftPerPiece, totalSqft } = calcBoardEntrySqft(
            length,
            width,
            preset.quantity
          );
          await tx.manufacturingBoardEntry.create({
            data: {
              modelId: model.id,
              boardInventoryId: inventories[0].id,
              length: roundDecimal(length),
              width: roundDecimal(width),
              quantity: preset.quantity,
              sqftPerPiece: roundDecimal(sqftPerPiece),
              totalSqft: roundDecimal(totalSqft),
            },
          });
        }
      }
      if (catalogModel.paintPresets.length > 0) {
        await tx.manufacturingModelPaintPreset.createMany({
          data: catalogModel.paintPresets.map((p) => ({
            modelId: model.id,
            paintProductId: p.paintProductId,
            quantity: p.quantity,
          })),
        });
        for (const preset of catalogModel.paintPresets) {
          const qty = roundDecimal(toNumber(preset.quantity));
          if (qty <= 0) continue;
          const stockQty = materialEntryStockQty("paint", qty, input.quantity);
          await reserveMaterialStock(tx, "paint", preset.paintProductId, stockQty, "Paint product");
          await tx.manufacturingPaintEntry.create({
            data: { modelId: model.id, paintProductId: preset.paintProductId, quantity: qty },
          });
        }
      }
      if (catalogModel.hardwarePresets.length > 0) {
        await tx.manufacturingModelHardwarePreset.createMany({
          data: catalogModel.hardwarePresets.map((p) => ({
            modelId: model.id,
            hardwareProductId: p.hardwareProductId,
            quantity: p.quantity,
          })),
        });
        for (const preset of catalogModel.hardwarePresets) {
          const qty = roundDecimal(toNumber(preset.quantity));
          if (qty <= 0) continue;
          const stockQty = materialEntryStockQty("hardware", qty, input.quantity);
          await reserveMaterialStock(
            tx,
            "hardware",
            preset.hardwareProductId,
            stockQty,
            "Hardware product"
          );
          await tx.manufacturingHardwareEntry.create({
            data: {
              modelId: model.id,
              hardwareProductId: preset.hardwareProductId,
              quantity: qty,
            },
          });
        }
      }
      if (catalogModel.packingPresets.length > 0) {
        await tx.manufacturingModelPackingPreset.createMany({
          data: catalogModel.packingPresets.map((p) => ({
            modelId: model.id,
            packingProductId: p.packingProductId,
            quantity: p.quantity,
          })),
        });
        for (const preset of catalogModel.packingPresets) {
          const qty = roundDecimal(toNumber(preset.quantity));
          if (qty <= 0) continue;
          const stockQty = materialEntryStockQty("packing", qty, input.quantity);
          await reserveMaterialStock(
            tx,
            "packing",
            preset.packingProductId,
            stockQty,
            "Packing product"
          );
          await tx.manufacturingPackingEntry.create({
            data: {
              modelId: model.id,
              packingProductId: preset.packingProductId,
              quantity: qty,
            },
          });
        }
      }
      if (catalogModel.edgeBindingPresets.length > 0) {
        await tx.manufacturingModelEdgeBindingPreset.createMany({
          data: catalogModel.edgeBindingPresets.map((p) => ({
            modelId: model.id,
            edgeBindingProductId: p.edgeBindingProductId,
            quantity: p.quantity,
          })),
        });
        for (const preset of catalogModel.edgeBindingPresets) {
          const qty = roundDecimal(toNumber(preset.quantity));
          if (qty <= 0) continue;
          const stockQty = materialEntryStockQty("edgebinding", qty, input.quantity);
          await reserveMaterialStock(
            tx,
            "edgebinding",
            preset.edgeBindingProductId,
            stockQty,
            "Edge binding product"
          );
          await tx.manufacturingEdgeBindingEntry.create({
            data: {
              modelId: model.id,
              edgeBindingProductId: preset.edgeBindingProductId,
              quantity: qty,
            },
          });
        }
      }
      if (catalogModel.glassPresets.length > 0) {
        await tx.manufacturingModelGlassPreset.createMany({
          data: catalogModel.glassPresets.map((p) => ({
            modelId: model.id,
            glassProductId: p.glassProductId,
            quantity: p.quantity,
          })),
        });
        for (const preset of catalogModel.glassPresets) {
          const qty = roundDecimal(toNumber(preset.quantity));
          if (qty <= 0) continue;
          const stockQty = materialEntryStockQty("glass", qty, input.quantity);
          await reserveMaterialStock(
            tx,
            "glass",
            preset.glassProductId,
            stockQty,
            "Glass product"
          );
          await tx.manufacturingGlassEntry.create({
            data: {
              modelId: model.id,
              glassProductId: preset.glassProductId,
              quantity: qty,
            },
          });
        }
      }
    });

    await invalidateMaterialOptions("paint");
    await invalidateMaterialOptions("hardware");
    await invalidateMaterialOptions("packing");
    await invalidateMaterialOptions("edgebinding");
    await invalidateMaterialOptions("glass");

    const updated = await prisma.manufacturingLot.findUnique({
      where: { id: lotId },
      include: lotInclude,
    });
    return mapLotDetail(updated!);
  }

  async updateModel(modelId: string, input: { quantity?: number }) {
    const model = await prisma.manufacturingModel.findUnique({
      where: { id: modelId },
      include: { lot: true },
    });
    if (!model) throw new Error("Model not found");

    await prisma.manufacturingModel.update({ where: { id: modelId }, data: input });

    const updated = await prisma.manufacturingLot.findUnique({
      where: { id: model.lotId },
      include: lotInclude,
    });
    return mapLotDetail(updated!);
  }

  async updatePolishLabor(modelId: string, input: UpdatePolishLaborInput) {
    const model = await prisma.manufacturingModel.findUnique({
      where: { id: modelId },
      select: { lotId: true },
    });
    if (!model) throw new Error("Model not found");

    await prisma.manufacturingModel.update({
      where: { id: modelId },
      data: { polishLaborPerQty: input.polishLaborPerQty },
    });

    const summary = await findLotSummaryById(model.lotId);
    if (!summary) throw new Error("Lot not found");
    return summary;
  }

  async deleteModel(modelId: string) {
    const model = await prisma.manufacturingModel.findUnique({
      where: { id: modelId },
      include: { lot: true },
    });
    if (!model) throw new Error("Model not found");

    await prisma.manufacturingModel.delete({ where: { id: modelId } });

    const updated = await prisma.manufacturingLot.findUnique({
      where: { id: model.lotId },
      include: lotInclude,
    });
    return mapLotDetail(updated!);
  }

  async createBoardEntry(modelId: string, input: CreateBoardEntryInput) {
    const model = await prisma.manufacturingModel.findUnique({
      where: { id: modelId },
      include: { lot: true },
    });
    if (!model) throw new Error("Model not found");

    const { sqftPerPiece, totalSqft } = calcBoardEntrySqft(
      input.length,
      input.width,
      input.quantity
    );
    const total = roundDecimal(totalSqft);

    // Planning only — board stock is adjusted via admin actual usage on the lot summary tab.
    await prisma.$transaction(async (tx) => {
      await tx.manufacturingBoardEntry.create({
        data: {
          modelId,
          boardInventoryId: input.boardInventoryId,
          length: roundDecimal(input.length),
          width: roundDecimal(input.width),
          quantity: input.quantity,
          sqftPerPiece: roundDecimal(sqftPerPiece),
          totalSqft: total,
        },
      });
    });

    return modelWriteAck(model.lotId, modelId);
  }

  async updateBoardEntry(entryId: string, input: Partial<CreateBoardEntryInput>) {
    const entry = await prisma.manufacturingBoardEntry.findUnique({
      where: { id: entryId },
      include: { model: { include: { lot: true } } },
    });
    if (!entry) throw new Error("Board entry not found");

    const length = roundDecimal(input.length ?? toNumber(entry.length));
    const width = roundDecimal(input.width ?? toNumber(entry.width));
    const quantity = input.quantity ?? entry.quantity;
    const { sqftPerPiece, totalSqft } = calcBoardEntrySqft(length, width, quantity);
    const newTotal = roundDecimal(totalSqft);
    const nextInventoryId = input.boardInventoryId ?? entry.boardInventoryId;

    await prisma.$transaction(async (tx) => {
      // Planning only — no board stock change.
      await tx.manufacturingBoardEntry.update({
        where: { id: entryId },
        data: {
          ...input,
          boardInventoryId: nextInventoryId,
          length,
          width,
          quantity,
          sqftPerPiece: roundDecimal(sqftPerPiece),
          totalSqft: newTotal,
        },
      });
    });

    return modelWriteAck(entry.model.lotId, entry.modelId);
  }

  async deleteBoardEntry(entryId: string) {
    const entry = await prisma.manufacturingBoardEntry.findUnique({
      where: { id: entryId },
      include: { model: { include: { lot: true } } },
    });
    if (!entry) throw new Error("Board entry not found");

    await prisma.$transaction(async (tx) => {
      // Planning only — no board stock change.
      await tx.manufacturingBoardEntry.delete({ where: { id: entryId } });
    });

    return modelWriteAck(entry.model.lotId, entry.modelId);
  }

  async createLotActualBoardEntry(lotId: string, input: CreateLotActualBoardEntryInput) {
    const lot = await prisma.manufacturingLot.findUnique({ where: { id: lotId } });
    if (!lot) throw new Error("Lot not found");

    const thickness = await prisma.boardThickness.findUnique({
      where: { id: input.boardThicknessId },
    });
    if (!thickness) throw new Error("Board thickness not found");

    const length = roundDecimal(input.length);
    const width = roundDecimal(input.width);
    const quantity = input.quantity;
    const sqftIn = roundDecimal(input.sqftIn);
    const sqftOut = roundDecimal(input.sqftOut);
    const total = calcActualBoardTotalSqft(length, width, quantity, sqftIn, sqftOut);

    await prisma.$transaction(async (tx) => {
      await applyBoardThicknessNetDelta(tx, input.boardThicknessId, total);
      await tx.lotActualBoardEntry.create({
        data: {
          lotId,
          boardThicknessId: input.boardThicknessId,
          length,
          width,
          quantity,
          sqftIn,
          sqftOut,
          totalSqft: total,
        },
      });
    });

    await invalidateBoardCaches();

    const summary = await findLotSummaryById(lotId);
    if (!summary) throw new Error("Lot not found");
    return summary;
  }

  async updateLotActualBoardEntry(
    lotId: string,
    entryId: string,
    input: Partial<CreateLotActualBoardEntryInput>
  ) {
    const entry = await prisma.lotActualBoardEntry.findUnique({
      where: { id: entryId },
      include: { lot: true },
    });
    if (!entry || entry.lotId !== lotId) throw new Error("Entry not found");

    const length = roundDecimal(input.length ?? toNumber(entry.length));
    const width = roundDecimal(input.width ?? toNumber(entry.width));
    const quantity = input.quantity ?? entry.quantity;
    const sqftIn = roundDecimal(input.sqftIn ?? toNumber(entry.sqftIn));
    const sqftOut = roundDecimal(input.sqftOut ?? toNumber(entry.sqftOut));
    const newTotal = calcActualBoardTotalSqft(length, width, quantity, sqftIn, sqftOut);
    const oldTotal = roundDecimal(toNumber(entry.totalSqft));
    const nextThicknessId = input.boardThicknessId ?? entry.boardThicknessId;

    await prisma.$transaction(async (tx) => {
      if (nextThicknessId === entry.boardThicknessId) {
        await applyBoardThicknessNetDelta(
          tx,
          entry.boardThicknessId,
          roundDecimal(newTotal - oldTotal)
        );
      } else {
        await applyBoardThicknessNetDelta(tx, entry.boardThicknessId, -oldTotal);
        await applyBoardThicknessNetDelta(tx, nextThicknessId, newTotal);
      }

      await tx.lotActualBoardEntry.update({
        where: { id: entryId },
        data: {
          boardThicknessId: nextThicknessId,
          length,
          width,
          quantity,
          sqftIn,
          sqftOut,
          totalSqft: newTotal,
        },
      });
    });

    await invalidateBoardCaches();

    const summary = await findLotSummaryById(entry.lotId);
    if (!summary) throw new Error("Lot not found");
    return summary;
  }

  async deleteLotActualBoardEntry(lotId: string, entryId: string) {
    const entry = await prisma.lotActualBoardEntry.findUnique({
      where: { id: entryId },
      include: { lot: true },
    });
    if (!entry || entry.lotId !== lotId) throw new Error("Entry not found");

    const oldTotal = roundDecimal(toNumber(entry.totalSqft));

    await prisma.$transaction(async (tx) => {
      await applyBoardThicknessNetDelta(tx, entry.boardThicknessId, -oldTotal);
      await tx.lotActualBoardEntry.delete({ where: { id: entryId } });
    });

    await invalidateBoardCaches();

    const summary = await findLotSummaryById(entry.lotId);
    if (!summary) throw new Error("Lot not found");
    return summary;
  }

  async getLotWorkerRates(lotId: string) {
    const lot = await prisma.manufacturingLot.findUnique({ where: { id: lotId } });
    if (!lot) throw new Error("Lot not found");
    return lotWorkerRepository.findRates(lotId);
  }

  async updateLotWorkerRates(lotId: string, input: UpdateLotWorkerRatesInput) {
    await lotWorkerRepository.upsertRates(lotId, input);
    const summary = await findLotSummaryById(lotId);
    if (!summary) throw new Error("Lot not found");
    return summary;
  }

  async getLotWorkerEntries(lotId: string) {
    const lot = await prisma.manufacturingLot.findUnique({ where: { id: lotId } });
    if (!lot) throw new Error("Lot not found");
    return lotWorkerRepository.findEntries(lotId);
  }

  async createLotWorkerEntry(lotId: string, input: CreateLotWorkerEntryInput) {
    await lotWorkerRepository.createEntry(lotId, input);
    const summary = await findLotSummaryById(lotId);
    if (!summary) throw new Error("Lot not found");
    return summary;
  }

  async updateLotWorkerEntry(
    lotId: string,
    entryId: string,
    input: UpdateLotWorkerEntryInput
  ) {
    const entry = await prisma.lotWorkerEntry.findUnique({
      where: { id: entryId },
      select: { lotId: true },
    });
    if (!entry || entry.lotId !== lotId) throw new Error("Entry not found");
    await lotWorkerRepository.updateEntry(entryId, input);
    const summary = await findLotSummaryById(entry.lotId);
    if (!summary) throw new Error("Lot not found");
    return summary;
  }

  async deleteLotWorkerEntry(lotId: string, entryId: string) {
    const entry = await prisma.lotWorkerEntry.findUnique({
      where: { id: entryId },
      select: { lotId: true },
    });
    if (!entry || entry.lotId !== lotId) throw new Error("Entry not found");
    await lotWorkerRepository.deleteEntry(entryId);
    const summary = await findLotSummaryById(entry.lotId);
    if (!summary) throw new Error("Lot not found");
    return summary;
  }

  async createPaintEntry(modelId: string, paintProductId: string, quantity: number) {
    return this.createMaterialEntry("paint", modelId, paintProductId, quantity);
  }

  async updatePaintEntry(entryId: string, paintProductId: string, quantity: number) {
    return this.updateMaterialEntry("paint", entryId, paintProductId, quantity);
  }

  async createHardwareEntry(modelId: string, hardwareProductId: string, quantity: number) {
    return this.createMaterialEntry("hardware", modelId, hardwareProductId, quantity);
  }

  async updateHardwareEntry(entryId: string, hardwareProductId: string, quantity: number) {
    return this.updateMaterialEntry("hardware", entryId, hardwareProductId, quantity);
  }

  async createPackingEntry(modelId: string, packingProductId: string, quantity: number) {
    return this.createMaterialEntry("packing", modelId, packingProductId, quantity);
  }

  async updatePackingEntry(entryId: string, packingProductId: string, quantity: number) {
    return this.updateMaterialEntry("packing", entryId, packingProductId, quantity);
  }

  async createEdgeBindingEntry(modelId: string, edgeBindingProductId: string, quantity: number) {
    return this.createMaterialEntry("edgebinding", modelId, edgeBindingProductId, quantity);
  }

  async updateEdgeBindingEntry(entryId: string, edgeBindingProductId: string, quantity: number) {
    return this.updateMaterialEntry("edgebinding", entryId, edgeBindingProductId, quantity);
  }

  async createGlassEntry(modelId: string, glassProductId: string, quantity: number) {
    return this.createMaterialEntry("glass", modelId, glassProductId, quantity);
  }

  async updateGlassEntry(entryId: string, glassProductId: string, quantity: number) {
    return this.updateMaterialEntry("glass", entryId, glassProductId, quantity);
  }

  private async createMaterialEntry(
    type: MaterialType,
    modelId: string,
    productId: string,
    quantity: number
  ) {
    const model = await prisma.manufacturingModel.findUnique({
      where: { id: modelId },
      include: { lot: true },
    });
    if (!model) throw new Error("Model not found");

    const label =
      type === "paint"
        ? "Paint product"
        : type === "hardware"
          ? "Hardware product"
          : type === "packing"
            ? "Packing product"
            : type === "edgebinding"
              ? "Edge binding product"
              : "Glass product";

    const qty = roundDecimal(quantity);
    const stockQty = materialEntryStockQty(type, qty, model.quantity);

    await prisma.$transaction(async (tx) => {
      await reserveMaterialStock(tx, type, productId, stockQty, label);

      if (type === "paint") {
        await tx.manufacturingPaintEntry.create({
          data: { modelId, paintProductId: productId, quantity: qty },
        });
      } else if (type === "hardware") {
        await tx.manufacturingHardwareEntry.create({
          data: { modelId, hardwareProductId: productId, quantity: qty },
        });
      } else if (type === "packing") {
        await tx.manufacturingPackingEntry.create({
          data: { modelId, packingProductId: productId, quantity: qty },
        });
      } else if (type === "edgebinding") {
        await tx.manufacturingEdgeBindingEntry.create({
          data: { modelId, edgeBindingProductId: productId, quantity: qty },
        });
      } else {
        await tx.manufacturingGlassEntry.create({
          data: { modelId, glassProductId: productId, quantity: qty },
        });
      }
    });

    await invalidateMaterialOptions(type);

    return modelWriteAck(model.lotId, modelId);
  }

  private async updateMaterialEntry(
    type: MaterialType,
    entryId: string,
    productId: string,
    quantity: number
  ) {
    const entry = await this.getMaterialEntry(type, entryId);
    const model = await prisma.manufacturingModel.findUnique({
      where: { id: entry.modelId },
      include: { lot: true },
    });
    if (!model) throw new Error("Model not found");

    const oldQty = roundDecimal(toNumber(entry.quantity));
    const newQty = roundDecimal(quantity);
    const oldStockQty = materialEntryStockQty(type, oldQty, model.quantity);
    const newStockQty = materialEntryStockQty(type, newQty, model.quantity);
    const oldProductId = entry.productId;

    await prisma.$transaction(async (tx) => {
      if (oldProductId === productId) {
        await adjustMaterialStock(tx, type, productId, oldStockQty, newStockQty);
      } else {
        await releaseMaterialStock(tx, type, oldProductId, oldStockQty);
        await reserveMaterialStock(tx, type, productId, newStockQty);
      }

      if (type === "paint") {
        await tx.manufacturingPaintEntry.update({
          where: { id: entryId },
          data: { paintProductId: productId, quantity: newQty },
        });
      } else if (type === "hardware") {
        await tx.manufacturingHardwareEntry.update({
          where: { id: entryId },
          data: { hardwareProductId: productId, quantity: newQty },
        });
      } else if (type === "packing") {
        await tx.manufacturingPackingEntry.update({
          where: { id: entryId },
          data: { packingProductId: productId, quantity: newQty },
        });
      } else if (type === "edgebinding") {
        await tx.manufacturingEdgeBindingEntry.update({
          where: { id: entryId },
          data: { edgeBindingProductId: productId, quantity: newQty },
        });
      } else {
        await tx.manufacturingGlassEntry.update({
          where: { id: entryId },
          data: { glassProductId: productId, quantity: newQty },
        });
      }
    });

    await invalidateMaterialOptions(type);

    return modelWriteAck(model.lotId, model.id);
  }

  async deletePaintEntry(entryId: string) {
    return this.deleteMaterialEntry("paint", entryId);
  }

  async deleteHardwareEntry(entryId: string) {
    return this.deleteMaterialEntry("hardware", entryId);
  }

  async deletePackingEntry(entryId: string) {
    return this.deleteMaterialEntry("packing", entryId);
  }

  async deleteEdgeBindingEntry(entryId: string) {
    return this.deleteMaterialEntry("edgebinding", entryId);
  }

  async deleteGlassEntry(entryId: string) {
    return this.deleteMaterialEntry("glass", entryId);
  }

  private async deleteMaterialEntry(type: MaterialType, entryId: string) {
    const entry = await this.getMaterialEntry(type, entryId);
    const model = await prisma.manufacturingModel.findUnique({
      where: { id: entry.modelId },
      include: { lot: true },
    });
    if (!model) throw new Error("Model not found");

    const qty = roundDecimal(toNumber(entry.quantity));
    const stockQty = materialEntryStockQty(type, qty, model.quantity);

    await prisma.$transaction(async (tx) => {
      await releaseMaterialStock(tx, type, entry.productId, stockQty);

      if (type === "paint") await tx.manufacturingPaintEntry.delete({ where: { id: entryId } });
      else if (type === "hardware") await tx.manufacturingHardwareEntry.delete({ where: { id: entryId } });
      else if (type === "packing") await tx.manufacturingPackingEntry.delete({ where: { id: entryId } });
      else if (type === "edgebinding") await tx.manufacturingEdgeBindingEntry.delete({ where: { id: entryId } });
      else await tx.manufacturingGlassEntry.delete({ where: { id: entryId } });
    });

    await invalidateMaterialOptions(type);

    return modelWriteAck(model.lotId, model.id);
  }

  private async getMaterialEntry(type: MaterialType, entryId: string) {
    if (type === "paint") {
      const e = await prisma.manufacturingPaintEntry.findUnique({ where: { id: entryId } });
      if (!e) throw new Error("Entry not found");
      return { modelId: e.modelId, productId: e.paintProductId, quantity: e.quantity };
    }
    if (type === "hardware") {
      const e = await prisma.manufacturingHardwareEntry.findUnique({ where: { id: entryId } });
      if (!e) throw new Error("Entry not found");
      return { modelId: e.modelId, productId: e.hardwareProductId, quantity: e.quantity };
    }
    if (type === "packing") {
      const e = await prisma.manufacturingPackingEntry.findUnique({ where: { id: entryId } });
      if (!e) throw new Error("Entry not found");
      return { modelId: e.modelId, productId: e.packingProductId, quantity: e.quantity };
    }
    if (type === "edgebinding") {
      const e = await prisma.manufacturingEdgeBindingEntry.findUnique({ where: { id: entryId } });
      if (!e) throw new Error("Entry not found");
      return { modelId: e.modelId, productId: e.edgeBindingProductId, quantity: e.quantity };
    }
    const e = await prisma.manufacturingGlassEntry.findUnique({ where: { id: entryId } });
    if (!e) throw new Error("Entry not found");
    return { modelId: e.modelId, productId: e.glassProductId, quantity: e.quantity };
  }

  async completeLot(lotId: string) {
    // Idempotent: already-completed lots return current detail (no re-deduction)
    const existing = await prisma.manufacturingLot.findUnique({
      where: { id: lotId },
      include: lotInclude,
    });
    if (!existing) throw new Error("Lot not found");
    if (existing.status === "COMPLETED" || existing.stockDeducted) {
      return mapLotDetail(existing);
    }

    return prisma.$transaction(async (tx) => {
      const lot = await tx.manufacturingLot.findUnique({
        where: { id: lotId },
        include: {
          models: {
            include: {
              boardEntries: true,
              paintEntries: true,
              hardwareEntries: true,
              packingEntries: true,
              edgeBindingEntries: true,
              glassEntries: true,
            },
          },
        },
      });

      if (!lot) throw new Error("Lot not found");
      // Concurrent completion race: another request finished inside the transaction
      if (lot.status === "COMPLETED" || lot.stockDeducted) {
        const completed = await tx.manufacturingLot.findUnique({
          where: { id: lotId },
          include: lotInclude,
        });
        return mapLotDetail(completed!);
      }
      if (lot.models.length === 0) {
        throw new Error("Cannot complete lot without models");
      }

      const calculatedBoardSqft = lot.models.reduce(
        (sum, model) =>
          sum +
          model.boardEntries.reduce(
            (entrySum, entry) =>
              entrySum + totalForModelQty(toNumber(entry.totalSqft), model.quantity),
            0
          ),
        0
      );

      const actualByThickness = await lotActualBoardRepository.sumByThickness(lotId);
      const totalActualBoardSqft = Array.from(actualByThickness.values()).reduce(
        (sum, v) => sum + v,
        0
      );

      if (calculatedBoardSqft > 0 && totalActualBoardSqft <= 0) {
        throw new Error(
          "Add actual board consumption before completing a lot with calculated board usage"
        );
      }

      type MaterialEntry = { productId: string; modelId: string; quantity: number };

      const paintEntries: MaterialEntry[] = [];
      const hardwareEntries: MaterialEntry[] = [];
      const packingEntries: MaterialEntry[] = [];
      const edgeBindingEntries: MaterialEntry[] = [];
      const glassEntries: MaterialEntry[] = [];

      for (const model of lot.models) {
        for (const entry of model.paintEntries) {
          paintEntries.push({
            productId: entry.paintProductId,
            modelId: model.id,
            quantity: roundDecimal(toNumber(entry.quantity)),
          });
        }
        for (const entry of model.hardwareEntries) {
          hardwareEntries.push({
            productId: entry.hardwareProductId,
            modelId: model.id,
            quantity: totalForModelQty(
              roundDecimal(toNumber(entry.quantity)),
              model.quantity
            ),
          });
        }
        for (const entry of model.packingEntries) {
          packingEntries.push({
            productId: entry.packingProductId,
            modelId: model.id,
            quantity: roundDecimal(toNumber(entry.quantity)),
          });
        }
        for (const entry of model.edgeBindingEntries) {
          edgeBindingEntries.push({
            productId: entry.edgeBindingProductId,
            modelId: model.id,
            quantity: totalForModelQty(
              roundDecimal(toNumber(entry.quantity)),
              model.quantity
            ),
          });
        }
        for (const entry of model.glassEntries) {
          glassEntries.push({
            productId: entry.glassProductId,
            modelId: model.id,
            quantity: totalForModelQty(
              roundDecimal(toNumber(entry.quantity)),
              model.quantity
            ),
          });
        }
      }

      async function writeMaterialConsumptionLogs(
        entries: MaterialEntry[],
        type: MaterialType
      ) {
        const byProduct = new Map<string, MaterialEntry[]>();
        for (const entry of entries) {
          const list = byProduct.get(entry.productId) ?? [];
          list.push(entry);
          byProduct.set(entry.productId, list);
        }

        for (const [productId, productEntries] of byProduct) {
          const product =
            type === "paint"
              ? await tx.paintProduct.findUnique({ where: { id: productId } })
              : type === "hardware"
                ? await tx.hardwareProduct.findUnique({ where: { id: productId } })
                : type === "packing"
                  ? await tx.packingProduct.findUnique({ where: { id: productId } })
                  : type === "edgebinding"
                    ? await tx.edgeBindingProduct.findUnique({ where: { id: productId } })
                    : await tx.glassProduct.findUnique({ where: { id: productId } });
          if (!product) throw new Error("Product not found");

          const totalUsed = roundDecimal(
            productEntries.reduce((sum, entry) => sum + entry.quantity, 0)
          );
          let running = roundDecimal(toNumber(product.remainingStock) + totalUsed);

          for (const entry of productEntries) {
            running = roundDecimal(running - entry.quantity);
            const logData = {
              productId: entry.productId,
              lotId,
              modelId: entry.modelId,
              quantity: entry.quantity,
              remainingAfter: running,
            };
            if (type === "paint") await tx.paintConsumptionLog.create({ data: logData });
            else if (type === "hardware") await tx.hardwareConsumptionLog.create({ data: logData });
            else if (type === "packing") await tx.packingConsumptionLog.create({ data: logData });
            else if (type === "edgebinding") await tx.edgeBindingConsumptionLog.create({ data: logData });
            else await tx.glassConsumptionLog.create({ data: logData });
          }
        }
      }

      await writeMaterialConsumptionLogs(paintEntries, "paint");
      await writeMaterialConsumptionLogs(hardwareEntries, "hardware");
      await writeMaterialConsumptionLogs(packingEntries, "packing");
      await writeMaterialConsumptionLogs(edgeBindingEntries, "edgebinding");
      await writeMaterialConsumptionLogs(glassEntries, "glass");

      await tx.manufacturingLot.update({
        where: { id: lotId },
        data: { status: "COMPLETED", stockDeducted: true },
      });

      const completed = await tx.manufacturingLot.findUnique({
        where: { id: lotId },
        include: lotInclude,
      });
      return mapLotDetail(completed!);
    });
  }
}

export const manufacturingService = new ManufacturingService();
