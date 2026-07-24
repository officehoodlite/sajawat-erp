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
import { createSupplierSchema } from "@/validators/inventory";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const suppliers = await inventoryService.getSuppliers();
    const pagination = parseOptionalPagination(request.nextUrl.searchParams);
    if (!pagination) {
      return successResponse(suppliers);
    }

    const { page, limit, search, skip } = pagination;
    const filtered = search
      ? suppliers.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
      : suppliers;
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
    return await caughtErrorResponse(error, "Failed to fetch suppliers", 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const parsedBody = await parseJsonBody(request, DEFAULT_BODY_LIMIT);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data;
    const parsed = createSupplierSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }
    const supplier = await inventoryService.createSupplier(parsed.data);
    return successResponse(supplier, 201);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to create supplier", 500);
  }
}
