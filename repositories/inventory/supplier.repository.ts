import { prisma } from "@/lib/prisma";
import { CACHE_KEYS, cacheDel, cacheGet, cacheSet } from "@/lib/redis";
import type { SupplierDto } from "@/types/dto";
import type { CreateSupplierInput, UpdateSupplierInput } from "@/validators/inventory";

function mapSupplier(row: {
  id: string;
  name: string;
  contactNumber: string | null;
  address: string | null;
  gstNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SupplierDto {
  return {
    id: row.id,
    name: row.name,
    contactNumber: row.contactNumber,
    address: row.address,
    gstNumber: row.gstNumber,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function optionalTrim(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export class SupplierRepository {
  async findAll(): Promise<SupplierDto[]> {
    const rows = await prisma.supplier.findMany({ orderBy: { name: "asc" } });
    return rows.map(mapSupplier);
  }

  async findAllCached(): Promise<SupplierDto[]> {
    const cached = await cacheGet<SupplierDto[]>(CACHE_KEYS.suppliers);
    if (cached) return cached;

    const suppliers = await this.findAll();
    await cacheSet(CACHE_KEYS.suppliers, suppliers);
    return suppliers;
  }

  async findById(id: string): Promise<SupplierDto | null> {
    const row = await prisma.supplier.findUnique({ where: { id } });
    return row ? mapSupplier(row) : null;
  }

  async create(data: CreateSupplierInput): Promise<SupplierDto> {
    const row = await prisma.supplier.create({
      data: {
        name: data.name.trim(),
        contactNumber: optionalTrim(data.contactNumber) ?? null,
        address: optionalTrim(data.address) ?? null,
        gstNumber: optionalTrim(data.gstNumber) ?? null,
      },
    });
    await this.invalidateCache();
    return mapSupplier(row);
  }

  async update(id: string, data: UpdateSupplierInput): Promise<SupplierDto> {
    const row = await prisma.supplier.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.contactNumber !== undefined
          ? { contactNumber: optionalTrim(data.contactNumber) ?? null }
          : {}),
        ...(data.address !== undefined ? { address: optionalTrim(data.address) ?? null } : {}),
        ...(data.gstNumber !== undefined ? { gstNumber: optionalTrim(data.gstNumber) ?? null } : {}),
      },
    });
    await this.invalidateCache();
    return mapSupplier(row);
  }

  async delete(id: string): Promise<void> {
    const referenced =
      (await prisma.boardInventory.count({ where: { supplierId: id } })) +
      (await prisma.paintPurchase.count({ where: { supplierId: id } })) +
      (await prisma.hardwarePurchase.count({ where: { supplierId: id } })) +
      (await prisma.packingPurchase.count({ where: { supplierId: id } }));

    if (referenced > 0) {
      throw new Error("Cannot delete supplier referenced by purchases");
    }

    await prisma.supplier.delete({ where: { id } });
    await this.invalidateCache();
  }

  async invalidateCache() {
    await cacheDel(CACHE_KEYS.suppliers);
  }
}

export const supplierRepository = new SupplierRepository();
