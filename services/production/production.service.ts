import { productionRepository } from "@/repositories/production/production.repository";
import type {
  CreateProductionEntryInput,
  ProductionListQuery,
  UpdateProductionEntryInput,
} from "@/validators/production";

export class ProductionService {
  list(query: ProductionListQuery) {
    return productionRepository.list(query);
  }

  listByWorkDate(date: string) {
    return productionRepository.findByWorkDate(date.trim());
  }

  findLotByNumber(lotNumber: string) {
    return productionRepository.findLotByNumber(lotNumber.trim());
  }

  lotModels(lotId: string) {
    return productionRepository.findLotModels(lotId);
  }

  suggestions() {
    return productionRepository.getSuggestions();
  }

  create(data: CreateProductionEntryInput) {
    return productionRepository.create(data);
  }

  update(id: string, data: UpdateProductionEntryInput) {
    return productionRepository.update(id, data);
  }

  delete(id: string) {
    return productionRepository.delete(id);
  }

  getById(id: string) {
    return productionRepository.findById(id);
  }
}

export const productionService = new ProductionService();
