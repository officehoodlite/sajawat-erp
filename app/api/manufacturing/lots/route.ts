import { NextRequest } from "next/server";
import { DEFAULT_BODY_LIMIT, LARGE_BODY_LIMIT, parseJsonBody } from "@/lib/request-body";
import { requireSession } from "@/lib/require-session";
import { caughtErrorResponse, errorResponse, parsePagination, successResponse } from "@/lib/api-response";
import { lotRepository } from "@/repositories/manufacturing/lot.repository";
import { manufacturingService } from "@/services/manufacturing/manufacturing.service";
import { createLotSchema } from "@/validators/manufacturing";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { page, limit, search, skip } = parsePagination(request.nextUrl.searchParams);
    const { items, total, lotCount, totalModels } = await lotRepository.findMany({
      skip,
      limit,
      search,
    });
    return successResponse({
      items,
      total,
      lotCount,
      totalModels,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to fetch lots", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const parsedBody = await parseJsonBody(request, LARGE_BODY_LIMIT);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data;
    const parsed = createLotSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }
    const lot = await manufacturingService.createLot(parsed.data);
    return successResponse(lot, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create lot";
    const status = message.includes("Unique constraint") ? 409 : 500;
    return await caughtErrorResponse(error, "Failed to create lot", status);
  }
}
