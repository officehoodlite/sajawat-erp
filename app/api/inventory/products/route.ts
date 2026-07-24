import { NextRequest } from "next/server";
import {
  caughtErrorResponse,
  errorResponse,
  parseOptionalPagination,
  successResponse,
} from "@/lib/api-response";
import { DEFAULT_BODY_LIMIT, parseJsonBody } from "@/lib/request-body";
import { requireSession } from "@/lib/require-session";
import { inventoryService } from "@/services/inventory/inventory.service";
import { createCatalogProductSchema } from "@/validators/inventory";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const detail = request.nextUrl.searchParams.get("detail") === "true";
    const products = detail
      ? await inventoryService.getCatalogProducts()
      : await inventoryService.getProducts();

    const pagination = parseOptionalPagination(request.nextUrl.searchParams);
    if (!pagination) {
      return successResponse(products);
    }

    const { page, limit, search, skip } = pagination;
    const filtered = search
      ? products.filter((p) =>
          "name" in p
            ? String(p.name).toLowerCase().includes(search.toLowerCase())
            : true
        )
      : products;
    const total = filtered.length;
    const items = filtered.slice(skip, skip + limit);
    return successResponse({
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to fetch products", 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const parsedBody = await parseJsonBody(request, DEFAULT_BODY_LIMIT);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data;
    const parsed = createCatalogProductSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }
    const product = await inventoryService.createCatalogProduct(parsed.data);
    return successResponse(product, 201);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to create product", 500);
  }
}
