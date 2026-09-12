import { NextRequest } from "next/server";
import { requireSession } from "@/lib/require-session";
import { caughtErrorResponse, successResponse } from "@/lib/api-response";
import { readImportXlsx } from "@/lib/read-import-xlsx";
import { importWorkerEntriesToAllLots } from "@/services/manufacturing/worker-import.service";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const file = await readImportXlsx(request);
    if (!file.ok) return file.response;

    const result = await importWorkerEntriesToAllLots(file.buffer);
    return successResponse(result, 201);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to import worker entries", 400);
  }
}
