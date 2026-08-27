import { Suspense } from "react";
import { GlassPageClient } from "@/features/inventory/components/glass-page";

export default function GlassPage() {
  return (
    <Suspense fallback={null}>
      <GlassPageClient />
    </Suspense>
  );
}
