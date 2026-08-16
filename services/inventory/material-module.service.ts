import { CACHE_KEYS, cacheDel, cacheGet, cacheSet } from "@/lib/redis";
import { getMaterialRepository } from "@/repositories/inventory/material-module.repository";
import type { MaterialModuleType } from "@/types/enums";
import type {
  CreateMaterialProductInput,
  CreateMaterialPurchaseInput,
  MaterialListQuery,
  UpdateMaterialProductInput,
  UpdateMaterialPurchaseInput,
} from "@/validators/inventory";

const OPTIONS_CACHE_KEYS: Record<MaterialModuleType, string> = {
  paint: CACHE_KEYS.paintOptions,
  hardware: CACHE_KEYS.hardwareOptions,
  packing: CACHE_KEYS.packingOptions,
};

export class MaterialModuleService {
  constructor(private readonly module: MaterialModuleType) {}

  private repo() {
    return getMaterialRepository(this.module);
  }

  private async invalidateOptionsCache() {
    await cacheDel(OPTIONS_CACHE_KEYS[this.module]);
  }

  getProducts(query: MaterialListQuery) {
    return this.repo().findProducts(query);
  }

  getProduct(id: string) {
    return this.repo().findProductById(id);
  }

  async createProduct(data: CreateMaterialProductInput) {
    const product = await this.repo().createProduct(data);
    await this.invalidateOptionsCache();
    return product;
  }

  async updateProduct(id: string, data: UpdateMaterialProductInput) {
    const product = await this.repo().updateProduct(id, data);
    await this.invalidateOptionsCache();
    return product;
  }

  async archiveProduct(id: string) {
    const product = await this.repo().archiveProduct(id);
    await this.invalidateOptionsCache();
    return product;
  }

  getStock() {
    return this.repo().findStock();
  }

  getPurchases(query: MaterialListQuery) {
    return this.repo().findPurchases(query);
  }

  getPurchase(id: string) {
    return this.repo().findPurchaseById(id);
  }

  async createPurchase(data: CreateMaterialPurchaseInput) {
    const purchase = await this.repo().createPurchase(data);
    await this.invalidateOptionsCache();
    return purchase;
  }

  async updatePurchase(id: string, data: UpdateMaterialPurchaseInput) {
    const purchase = await this.repo().updatePurchase(id, data);
    await this.invalidateOptionsCache();
    return purchase;
  }

  async deletePurchase(id: string) {
    await this.repo().deletePurchase(id);
    await this.invalidateOptionsCache();
  }

  getConsumption(query: MaterialListQuery) {
    return this.repo().findConsumption(query);
  }

  async getOptions(opts?: { forCatalog?: boolean }) {
    if (opts?.forCatalog) {
      return this.repo().findCatalogOptions();
    }
    const cacheKey = OPTIONS_CACHE_KEYS[this.module];
    const cached = await cacheGet<Awaited<ReturnType<ReturnType<typeof getMaterialRepository>["findOptions"]>>>(
      cacheKey
    );
    if (cached) return cached;
    const options = await this.repo().findOptions();
    await cacheSet(cacheKey, options);
    return options;
  }
}

const services = {
  paint: new MaterialModuleService("paint"),
  hardware: new MaterialModuleService("hardware"),
  packing: new MaterialModuleService("packing"),
};

export function getMaterialModuleService(module: MaterialModuleType) {
  return services[module];
}
