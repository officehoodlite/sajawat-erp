import { NextRequest } from "next/server";
import { requireSession } from "@/lib/require-session";
import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import { importWorkerEntriesForLots } from "@/services/manufacturing/worker-import.service";

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

function parseLotIds(form: FormData): string[] {
  const raw = form.get("lotIds");
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((id) => String(id).trim()).filter(Boolean);
      }
    } catch {
      // fall through
    }
  }
  return form
    .getAll("lotIds")
    .filter((value): value is string => typeof value === "string")
    .map((id) => id.trim())
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const form = await request.formData();
    const lotIds = parseLotIds(form);
    if (lotIds.length === 0) {
      return errorResponse("Select at least one lot before importing", 400);
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      return errorResponse("Upload an .xlsx file", 400);
    }
    if (file.size > MAX_IMPORT_BYTES) {
      return errorResponse("File is too large", 413);
    }
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      return errorResponse("File must be .xlsx", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await importWorkerEntriesForLots(buffer, lotIds);
    return successResponse(result, 201);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to import worker entries", 400);
  }
}
