import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { rethrowPrismaWrite } from "@/lib/prisma-write";
import { toNumber } from "@/lib/mappers";
import { CACHE_KEYS, cacheDel, cacheGet, cacheSet } from "@/lib/redis";
import type { CatalogProductDetailDto, CatalogProductModelDto, ProductDto } from "@/types/dto";
import type {
  CatalogProductModelWrite,
  CreateCatalogProductInput,
  UpdateCatalogProductInput,
} from "@/validators/inventory";

const productModelInclude = {
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
};

type ProductModelRow = {
  id: string;
  productId: string;
  modelName: string;
  partCount: number;
  createdAt: Date;
  updatedAt: Date;
  boardPresets: Array<{
    id: string;
    boardThicknessId: string;
    length: unknown;
    width: unknown;
    quantity: number;
    boardThickness: { thickness: string; board: { materialName: string } };
  }>;
  paintPresets: Array<{
    id: string;
    paintProductId: string;
    quantity: unknown;
    paintProduct: { name: string; brand: string | null };
  }>;
  hardwarePresets: Array<{
    id: string;
    hardwareProductId: string;
    quantity: unknown;
    hardwareProduct: { name: string; brand: string | null };
  }>;
  packingPresets: Array<{
    id: string;
    packingProductId: string;
    quantity: unknown;
    packingProduct: { name: string; brand: string | null };
  }>;
  edgeBindingPresets: Array<{
    id: string;
    edgeBindingProductId: string;
    quantity: unknown;
    edgeBindingProduct: { name: string; brand: string | null };
  }>;
};

function materialLabel(name: string, brand: string | null) {
  return brand ? `${name} (${brand})` : name;
}

function mapProductModel(row: ProductModelRow): CatalogProductModelDto {
  return {
    id: row.id,
    productId: row.productId,
    modelName: row.modelName,
    partCount: row.partCount,
    boardPresetCount: row.boardPresets.length,
    paintPresetCount: row.paintPresets.length,
    hardwarePresetCount: row.hardwarePresets.length,
    packingPresetCount: row.packingPresets.length,
    edgeBindingPresetCount: row.edgeBindingPresets.length,
    boardPresets: row.boardPresets.map((p) => ({
      id: p.id,
      boardThicknessId: p.boardThicknessId,
      label: `${p.boardThickness.board.materialName} ${p.boardThickness.thickness}`,
      length: toNumber(p.length),
      width: toNumber(p.width),
      quantity: p.quantity,
    })),
    paintPresets: row.paintPresets.map((p) => ({
      id: p.id,
      productId: p.paintProductId,
      label: materialLabel(p.paintProduct.name, p.paintProduct.brand),
      quantity: toNumber(p.quantity),
    })),
    hardwarePresets: row.hardwarePresets.map((p) => ({
      id: p.id,
      productId: p.hardwareProductId,
      label: materialLabel(p.hardwareProduct.name, p.hardwareProduct.brand),
      quantity: toNumber(p.quantity),
    })),
    packingPresets: row.packingPresets.map((p) => ({
      id: p.id,
      productId: p.packingProductId,
      label: materialLabel(p.packingProduct.name, p.packingProduct.brand),
      quantity: toNumber(p.quantity),
    })),
    edgeBindingPresets: row.edgeBindingPresets.map((p) => ({
      id: p.id,
      productId: p.edgeBindingProductId,
      label: materialLabel(p.edgeBindingProduct.name, p.edgeBindingProduct.brand),
      quantity: toNumber(p.quantity),
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapProductDetail(row: {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  models: ProductModelRow[];
}): CatalogProductDetailDto {
  return {
    id: row.id,
    name: row.name,
    models: row.models.map(mapProductModel),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function replaceModelPresets(
  tx: Prisma.TransactionClient,
  productModelId: string,
  data: CatalogProductModelWrite
) {
  try {
    await tx.productModelBoardPreset.deleteMany({ where: { productModelId } });
    await tx.productModelPaintPreset.deleteMany({ where: { productModelId } });
    await tx.productModelHardwarePreset.deleteMany({ where: { productModelId } });
    await tx.productModelPackingPreset.deleteMany({ where: { productModelId } });
    await tx.productModelEdgeBindingPreset.deleteMany({ where: { productModelId } });

    if (data.boardPresets.length > 0) {
      await tx.productModelBoardPreset.createMany({
        data: data.boardPresets.map((preset) => ({
          productModelId,
          boardThicknessId: preset.boardThicknessId,
          length: preset.length,
          width: preset.width,
          quantity: preset.quantity,
        })),
      });
    }
    if (data.paintPresets.length > 0) {
      await tx.productModelPaintPreset.createMany({
        data: data.paintPresets.map((preset) => ({
          productModelId,
          paintProductId: preset.productId,
          quantity: preset.quantity,
        })),
      });
    }
    if (data.hardwarePresets.length > 0) {
      await tx.productModelHardwarePreset.createMany({
        data: data.hardwarePresets.map((preset) => ({
          productModelId,
          hardwareProductId: preset.productId,
          quantity: preset.quantity,
        })),
      });
    }
    if (data.packingPresets.length > 0) {
      await tx.productModelPackingPreset.createMany({
        data: data.packingPresets.map((preset) => ({
          productModelId,
          packingProductId: preset.productId,
          quantity: preset.quantity,
        })),
      });
    }
    if (data.edgeBindingPresets.length > 0) {
      await tx.productModelEdgeBindingPreset.createMany({
        data: data.edgeBindingPresets.map((preset) => ({
          productModelId,
          edgeBindingProductId: preset.productId,
          quantity: preset.quantity,
        })),
      });
    }
  } catch (error) {
    rethrowPrismaWrite(error);
  }
}

export class ProductRepository {
  async findAll() {
    return prisma.product.findMany({ orderBy: { name: "asc" } });
  }

  async findAllCached(): Promise<ProductDto[]> {
    const cached = await cacheGet<ProductDto[]>(CACHE_KEYS.products);
    if (cached) return cached;

    const products = await this.findAll();
    const data = products.map((p) => ({ id: p.id, name: p.name }));
    await cacheSet(CACHE_KEYS.products, data);
    return data;
  }

  async findById(id: string): Promise<CatalogProductDetailDto | null> {
    const row = await prisma.product.findUnique({
      where: { id },
      include: {
        models: {
          orderBy: { modelName: "asc" },
          include: productModelInclude,
        },
      },
    });
    return row ? mapProductDetail(row) : null;
  }

  async findAllWithModels(): Promise<CatalogProductDetailDto[]> {
    const rows = await prisma.product.findMany({
      orderBy: { name: "asc" },
      include: {
        models: {
          orderBy: { modelName: "asc" },
          include: productModelInclude,
        },
      },
    });
    return rows.map(mapProductDetail);
  }

  async findAllWithModelNames(): Promise<CatalogProductDetailDto[]> {
    const rows = await prisma.product.findMany({
      orderBy: { name: "asc" },
      include: {
        models: {
          orderBy: { modelName: "asc" },
          select: {
            id: true,
            productId: true,
            modelName: true,
            partCount: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                boardPresets: true,
                paintPresets: true,
                hardwarePresets: true,
                packingPresets: true,
                edgeBindingPresets: true,
              },
            },
          },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      models: row.models.map((model) => ({
        id: model.id,
        productId: model.productId,
        modelName: model.modelName,
        partCount: model.partCount,
        boardPresetCount: model._count.boardPresets,
        paintPresetCount: model._count.paintPresets,
        hardwarePresetCount: model._count.hardwarePresets,
        packingPresetCount: model._count.packingPresets,
        edgeBindingPresetCount: model._count.edgeBindingPresets,
        boardPresets: [],
        paintPresets: [],
        hardwarePresets: [],
        packingPresets: [],
        edgeBindingPresets: [],
        createdAt: model.createdAt.toISOString(),
        updatedAt: model.updatedAt.toISOString(),
      })),
    }));
  }

  async create(data: CreateCatalogProductInput): Promise<CatalogProductDetailDto> {
    const row = await prisma.product.create({
      data: { name: data.name.trim() },
      include: {
        models: {
          include: productModelInclude,
        },
      },
    });
    await this.invalidateCache();
    return mapProductDetail(row);
  }

  async update(id: string, data: UpdateCatalogProductInput): Promise<CatalogProductDetailDto> {
    const row = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      },
      include: {
        models: {
          orderBy: { modelName: "asc" },
          include: productModelInclude,
        },
      },
    });
    await this.invalidateCache();
    return mapProductDetail(row);
  }

  async delete(id: string): Promise<void> {
    const referenced = await prisma.manufacturingModel.count({ where: { productId: id } });
    if (referenced > 0) {
      throw new Error("Cannot delete product used in manufacturing lots");
    }

    await prisma.product.delete({ where: { id } });
    await this.invalidateCache();
  }

  async createModel(
    productId: string,
    data: CatalogProductModelWrite
  ): Promise<CatalogProductModelDto> {
    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.productModel.create({
        data: {
          productId,
          modelName: data.modelName.trim(),
          partCount: data.partCount,
        },
      });
      await replaceModelPresets(tx, created.id, data);
      return tx.productModel.findUniqueOrThrow({
        where: { id: created.id },
        include: productModelInclude,
      });
    });
    await this.invalidateCache();
    return mapProductModel(row);
  }

  async updateModel(
    productId: string,
    modelId: string,
    data: CatalogProductModelWrite
  ): Promise<CatalogProductModelDto> {
    const existing = await prisma.productModel.findFirst({
      where: { id: modelId, productId },
    });
    if (!existing) throw new Error("Model not found");

    const referenced = await prisma.manufacturingModel.count({
      where: { catalogModelId: modelId },
    });

    const identityChanged =
      existing.modelName !== data.modelName.trim() || existing.partCount !== data.partCount;

    if (referenced > 0 && identityChanged) {
      throw new Error(
        "Cannot rename or change parts for a catalog model used in manufacturing lots. Material presets can still be updated."
      );
    }

    const row = await prisma.$transaction(async (tx) => {
      await tx.productModel.update({
        where: { id: modelId },
        data: {
          modelName: data.modelName.trim(),
          partCount: data.partCount,
        },
      });
      await replaceModelPresets(tx, modelId, data);
      return tx.productModel.findUniqueOrThrow({
        where: { id: modelId },
        include: productModelInclude,
      });
    });
    await this.invalidateCache();
    return mapProductModel(row);
  }

  async deleteModel(productId: string, modelId: string): Promise<void> {
    const existing = await prisma.productModel.findFirst({
      where: { id: modelId, productId },
    });
    if (!existing) throw new Error("Model not found");

    const referenced = await prisma.manufacturingModel.count({
      where: { catalogModelId: modelId },
    });
    if (referenced > 0) {
      throw new Error("Cannot delete catalog model used in manufacturing lots");
    }

    await prisma.productModel.delete({ where: { id: modelId } });
    await this.invalidateCache();
  }

  async findModelsByProduct(productId: string): Promise<CatalogProductModelDto[]> {
    const rows = await prisma.productModel.findMany({
      where: { productId },
      orderBy: { modelName: "asc" },
      include: productModelInclude,
    });
    return rows.map(mapProductModel);
  }

  async invalidateCache() {
    await cacheDel(CACHE_KEYS.products);
  }
}

export const productRepository = new ProductRepository();
