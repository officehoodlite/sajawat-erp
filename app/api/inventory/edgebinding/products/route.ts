import { NextRequest } from "next/server";
import { createMaterialModuleHandlers } from "@/lib/material-module-api";

const handlers = createMaterialModuleHandlers("edgebinding");

export async function GET(request: NextRequest) {
  return handlers.products.GET(request);
}

export async function POST(request: NextRequest) {
  return handlers.products.POST(request);
}
