import { NextRequest } from "next/server";
import { headers } from "next/headers";
import {
  caughtErrorResponse,
  errorResponse,
  successResponse,
} from "@/lib/api-response";
import {
  HEAVY_READ_LIMIT,
  clientIpFromRequest,
  enforceRateLimit,
} from "@/lib/rate-limit";
import { DEFAULT_BODY_LIMIT, parseJsonBody } from "@/lib/request-body";
import { requireSession } from "@/lib/require-session";
import { getMaterialModuleService } from "@/services/inventory/material-module.service";
import type { MaterialModuleType } from "@/types/enums";
import {
  createMaterialProductSchema,
  createMaterialPurchaseSchema,
  materialListQuerySchema,
  updateMaterialProductSchema,
  updateMaterialPurchaseSchema,
} from "@/validators/inventory";

function parseListQuery(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  return materialListQuerySchema.parse({
    page: sp.get("page") ?? 1,
    limit: sp.get("limit") ?? 10,
    search: sp.get("search") ?? "",
    productId: sp.get("productId") ?? undefined,
    activeOnly: sp.get("activeOnly") ?? undefined,
  });
}

async function guardSession() {
  return requireSession();
}

async function guardHeavyRead(request: NextRequest, path: string) {
  let correlationId: string | undefined;
  try {
    correlationId = (await headers()).get("x-correlation-id") ?? undefined;
  } catch {
    /* ignore */
  }
  const ip = clientIpFromRequest(request);
  return enforceRateLimit({
    key: `heavy-read:${ip}`,
    ...HEAVY_READ_LIMIT,
    ip,
    path,
    correlationId,
  });
}

export function createMaterialModuleHandlers(module: MaterialModuleType) {
  const service = getMaterialModuleService(module);
  const base = `/api/inventory/${module}`;

  return {
    products: {
      GET: async (request: NextRequest) => {
        try {
          const session = await guardSession();
          if (!session.ok) return session.response;
          const query = parseListQuery(request);
          const data = await service.getProducts(query);
          return successResponse(data);
        } catch (error) {
          return await caughtErrorResponse(error, "Failed to fetch products", 500);
        }
      },
      POST: async (request: NextRequest) => {
        try {
          const session = await guardSession();
          if (!session.ok) return session.response;
          const body = await parseJsonBody(request, DEFAULT_BODY_LIMIT);
          if (!body.ok) return body.response;
          const parsed = createMaterialProductSchema.safeParse(body.data);
          if (!parsed.success) {
            return errorResponse("Validation failed", 400, parsed.error.flatten());
          }
          const product = await service.createProduct(parsed.data);
          return successResponse(product, 201);
        } catch (error) {
          return await caughtErrorResponse(error, "Failed to create product", 400);
        }
      },
    },
    productById: {
      GET: async (_request: NextRequest, id: string) => {
        try {
          const session = await guardSession();
          if (!session.ok) return session.response;
          const product = await service.getProduct(id);
          if (!product) return errorResponse("Product not found", 404);
          return successResponse(product);
        } catch (error) {
          return await caughtErrorResponse(error, "Failed to fetch product", 500);
        }
      },
      PUT: async (request: NextRequest, id: string) => {
        try {
          const session = await guardSession();
          if (!session.ok) return session.response;
          const body = await parseJsonBody(request, DEFAULT_BODY_LIMIT);
          if (!body.ok) return body.response;
          const parsed = updateMaterialProductSchema.safeParse(body.data);
          if (!parsed.success) {
            return errorResponse("Validation failed", 400, parsed.error.flatten());
          }
          const product = await service.updateProduct(id, parsed.data);
          return successResponse(product);
        } catch (error) {
          return await caughtErrorResponse(error, "Failed to update product", 400);
        }
      },
      PATCH: async (_request: NextRequest, id: string) => {
        try {
          const session = await guardSession();
          if (!session.ok) return session.response;
          const product = await service.archiveProduct(id);
          return successResponse(product);
        } catch (error) {
          return await caughtErrorResponse(error, "Failed to archive product", 400);
        }
      },
    },
    stock: {
      GET: async (request: NextRequest) => {
        try {
          const session = await guardSession();
          if (!session.ok) return session.response;
          const limited = await guardHeavyRead(request, `${base}/stock`);
          if (!limited.allowed) {
            return errorResponse("Too many requests. Please try again later.", 429, {
              retryAfterSec: limited.retryAfterSec,
            });
          }
          const data = await service.getStock();
          return successResponse(data);
        } catch (error) {
          return await caughtErrorResponse(error, "Failed to fetch stock", 500);
        }
      },
    },
    purchases: {
      GET: async (request: NextRequest) => {
        try {
          const session = await guardSession();
          if (!session.ok) return session.response;
          const query = parseListQuery(request);
          const data = await service.getPurchases(query);
          return successResponse(data);
        } catch (error) {
          return await caughtErrorResponse(error, "Failed to fetch purchases", 500);
        }
      },
      POST: async (request: NextRequest) => {
        try {
          const session = await guardSession();
          if (!session.ok) return session.response;
          const body = await parseJsonBody(request, DEFAULT_BODY_LIMIT);
          if (!body.ok) return body.response;
          const parsed = createMaterialPurchaseSchema.safeParse(body.data);
          if (!parsed.success) {
            return errorResponse("Validation failed", 400, parsed.error.flatten());
          }
          const purchase = await service.createPurchase(parsed.data);
          return successResponse(purchase, 201);
        } catch (error) {
          return await caughtErrorResponse(error, "Failed to create purchase", 400);
        }
      },
    },
    purchaseById: {
      PUT: async (request: NextRequest, id: string) => {
        try {
          const session = await guardSession();
          if (!session.ok) return session.response;
          const body = await parseJsonBody(request, DEFAULT_BODY_LIMIT);
          if (!body.ok) return body.response;
          const parsed = updateMaterialPurchaseSchema.safeParse(body.data);
          if (!parsed.success) {
            return errorResponse("Validation failed", 400, parsed.error.flatten());
          }
          const purchase = await service.updatePurchase(id, parsed.data);
          return successResponse(purchase);
        } catch (error) {
          return await caughtErrorResponse(error, "Failed to update purchase", 400);
        }
      },
      DELETE: async (_request: NextRequest, id: string) => {
        try {
          const session = await guardSession();
          if (!session.ok) return session.response;
          await service.deletePurchase(id);
          return successResponse({ success: true });
        } catch (error) {
          return await caughtErrorResponse(error, "Failed to delete purchase", 400);
        }
      },
    },
    consumption: {
      GET: async (request: NextRequest) => {
        try {
          const session = await guardSession();
          if (!session.ok) return session.response;
          const query = parseListQuery(request);
          const data = await service.getConsumption(query);
          return successResponse(data);
        } catch (error) {
          return await caughtErrorResponse(error, "Failed to fetch consumption", 500);
        }
      },
    },
    options: {
      GET: async (request: NextRequest) => {
        try {
          const session = await guardSession();
          if (!session.ok) return session.response;
          const forCatalog = request.nextUrl.searchParams.get("forCatalog") === "true";
          const data = await service.getOptions({ forCatalog });
          return successResponse(data);
        } catch (error) {
          return await caughtErrorResponse(error, "Failed to fetch options", 500);
        }
      },
    },
  };
}
