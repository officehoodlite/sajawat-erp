import { NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-response";

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export async function readImportXlsx(request: NextRequest) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return { ok: false as const, response: errorResponse("Upload an .xlsx file", 400) };
  }
  if (file.size > MAX_IMPORT_BYTES) {
    return { ok: false as const, response: errorResponse("File is too large", 413) };
  }
  const name = file.name.toLowerCase();
  if (!name.endsWith(".xlsx")) {
    return { ok: false as const, response: errorResponse("File must be .xlsx", 400) };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return { ok: true as const, buffer };
}
