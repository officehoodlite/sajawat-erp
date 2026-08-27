import { NextRequest } from "next/server";
import { createMaterialModuleHandlers } from "@/lib/material-module-api";

type Params = { params: Promise<{ id: string }> };
const handlers = createMaterialModuleHandlers("glass");

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return handlers.purchaseById.PUT(request, id);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  return handlers.purchaseById.DELETE(_request, id);
}
