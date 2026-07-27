import { Suspense } from "react";
import { PackingPageClient } from "@/features/inventory/components/packing-page";

export default function PackingPage() {
  return (
    <Suspense fallback={null}>
      <PackingPageClient />
    </Suspense>
  );
}
