import { NextRequest } from "next/server";
import { createMaterialModuleHandlers } from "@/lib/material-module-api";

type Params = { params: Promise<{ id: string }> };
const handlers = createMaterialModuleHandlers("packing");

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  return handlers.productById.GET(_request, id);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return handlers.productById.PUT(request, id);
}

export async function PATCH(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  return handlers.productById.PATCH(_request, id);
}
