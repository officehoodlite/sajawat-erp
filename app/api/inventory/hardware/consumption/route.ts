import { NextRequest } from "next/server";
import { createMaterialModuleHandlers } from "@/lib/material-module-api";

const handlers = createMaterialModuleHandlers("hardware");

export async function GET(request: NextRequest) {
  return handlers.consumption.GET(request);
}
