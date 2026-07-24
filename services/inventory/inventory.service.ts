import { CACHE_KEYS, cacheDel, cacheGet, cacheSet } from "@/lib/redis";
import { boardRepository } from "@/repositories/inventory/board.repository";
import { productRepository } from "@/repositories/inventory/product.repository";
import { supplierRepository } from "@/repositories/inventory/supplier.repository";
import type {
  CreateBoardInput,
  CreateBoardInventoryInput,
  CreateBoardThicknessInput,
  UpdateBoardInput,
  UpdateBoardInventoryInput,
  UpdateBoardThicknessInput,
} from "@/validators/inventory";

export class InventoryService {
  async getBoardMaterials() {
    const boards = await boardRepository.findAllMaterials();
    return boards.map((b) => ({
      id: b.id,
      materialName: b.materialName,
      thicknessCount: b._count.thicknesses,
    }));
  }

  async getBoardMaterialsPaginated(page: number, limit: number, search: string) {
    return boardRepository.findMaterialsPaginated({ page, limit, search });
  }

  async getBoardStock() {
    return boardRepository.findStockAggregated();
  }

  async getBoardPurchases(page: number, limit: number, search: string) {
    return boardRepository.findPurchasesPaginated({ page, limit, search });
  }

  async getBoardConsumption(page: number, limit: number, search: string) {
    return boardRepository.findConsumptionPaginated({ page, limit, search });
  }

  async createBoardMaterial(data: CreateBoardInput) {
    const board = await boardRepository.createMaterial(data);
    await this.invalidateBoardCache();
    return {
      id: board.id,
      materialName: board.materialName,
      thicknessCount: 0,
    };
  }

  async updateBoardMaterial(id: string, data: UpdateBoardInput) {
    const board = await boardRepository.updateMaterial(id, data);
    await this.invalidateBoardCache();
    const thicknesses = await boardRepository.findThicknessesByBoard(id);
    return {
      id: board.id,
      materialName: board.materialName,
      thicknessCount: thicknesses.length,
    };
  }

  async deleteBoardMaterial(id: string) {
    await boardRepository.deleteMaterial(id);
    await this.invalidateBoardCache();
  }

  async getThicknesses(boardId: string) {
    const rows = await boardRepository.findThicknessesByBoard(boardId);
    return rows.map((t) => ({
      id: t.id,
      boardId: t.boardId,
      thickness: t.thickness,
      materialName: t.board.materialName,
    }));
  }

  async createThickness(data: CreateBoardThicknessInput) {
    await boardRepository.createThickness(data);
    await this.invalidateBoardCache();
    return this.getThicknesses(data.boardId);
  }

  async updateThickness(id: string, data: UpdateBoardThicknessInput) {
    const updated = await boardRepository.updateThickness(id, data);
    await this.invalidateBoardCache();
    return this.getThicknesses(updated.boardId);
  }

  async deleteThickness(id: string) {
    await boardRepository.deleteThickness(id);
    await this.invalidateBoardCache();
  }

  async getBoardInventories(boardThicknessId?: string) {
    return boardRepository.findInventories(boardThicknessId);
  }

  async getThicknessOptions() {
    return boardRepository.findAllThicknessOptions();
  }

  async createBoardInventory(data: CreateBoardInventoryInput) {
    const result = await boardRepository.createInventory(data);
    await this.invalidateBoardCache();
    return result;
  }

  async updateBoardInventory(id: string, data: UpdateBoardInventoryInput) {
    const result = await boardRepository.updateInventory(id, data);
    await this.invalidateBoardCache();
    return result;
  }

  async deleteBoardInventory(id: string) {
    await boardRepository.deleteInventory(id);
    await this.invalidateBoardCache();
  }

  async getBoardOptions() {
    const cached = await cacheGet<Awaited<ReturnType<typeof boardRepository.findBoardOptions>>>(
      CACHE_KEYS.boardOptions
    );
    if (cached) return cached;
    const options = await boardRepository.findBoardOptions();
    await cacheSet(CACHE_KEYS.boardOptions, options);
    return options;
  }

  async getAllBoardOptionsIncludingZero() {
    const rows = await boardRepository.findInventories();
    return rows.map((r) => ({
      id: r.id,
      label: `${r.materialName} ${r.thickness} — ${r.remainingSqft} sqft remaining (${r.supplierName ?? "No supplier"})`,
      materialName: r.materialName,
      thickness: r.thickness,
      remainingSqft: r.remainingSqft,
      supplierId: r.supplierId,
      supplierName: r.supplierName,
    }));
  }

  async getProducts() {
    return productRepository.findAllCached();
  }

  async getCatalogProducts() {
    return productRepository.findAllWithModels();
  }

  async getCatalogProduct(id: string) {
    const product = await productRepository.findById(id);
    if (!product) throw new Error("Product not found");
    return product;
  }

  async createCatalogProduct(data: import("@/validators/inventory").CreateCatalogProductInput) {
    return productRepository.create(data);
  }

  async updateCatalogProduct(
    id: string,
    data: import("@/validators/inventory").UpdateCatalogProductInput
  ) {
    return productRepository.update(id, data);
  }

  async deleteCatalogProduct(id: string) {
    await productRepository.delete(id);
  }

  async createCatalogProductModel(
    productId: string,
    data: import("@/validators/inventory").CatalogProductModelWrite
  ) {
    return productRepository.createModel(productId, data);
  }

  async updateCatalogProductModel(
    productId: string,
    modelId: string,
    data: import("@/validators/inventory").CatalogProductModelWrite
  ) {
    return productRepository.updateModel(productId, modelId, data);
  }

  async deleteCatalogProductModel(productId: string, modelId: string) {
    await productRepository.deleteModel(productId, modelId);
  }

  async getSuppliers() {
    return supplierRepository.findAllCached();
  }

  async createSupplier(data: import("@/validators/inventory").CreateSupplierInput) {
    return supplierRepository.create(data);
  }

  async updateSupplier(id: string, data: import("@/validators/inventory").UpdateSupplierInput) {
    return supplierRepository.update(id, data);
  }

  async deleteSupplier(id: string) {
    await supplierRepository.delete(id);
  }

  private async invalidateBoardCache() {
    await cacheDel(CACHE_KEYS.boardOptions);
  }
}

export const inventoryService = new InventoryService();
