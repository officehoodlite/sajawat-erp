import type { NextRequest } from "next/server";
import { createMaterialModuleHandlers } from "@/lib/material-module-api";

const handlers = createMaterialModuleHandlers("glass");

export async function GET(request: NextRequest) {
  return handlers.stock.GET(request);
}
