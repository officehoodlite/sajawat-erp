import { Suspense } from "react";
import { PaintPageClient } from "@/features/inventory/components/paint-page";

export default function PaintPage() {
  return (
    <Suspense fallback={null}>
      <PaintPageClient />
    </Suspense>
  );
}
