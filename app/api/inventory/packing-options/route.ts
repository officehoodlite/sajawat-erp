import type { NextRequest } from "next/server";
import { createMaterialModuleHandlers } from "@/lib/material-module-api";

const handlers = createMaterialModuleHandlers("packing");

export async function GET(request: NextRequest) {
  return handlers.options.GET(request);
}
