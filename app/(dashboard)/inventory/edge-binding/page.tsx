import { Suspense } from "react";
import { EdgeBindingPageClient } from "@/features/inventory/components/edge-binding-page";

export default function EdgeBindingPage() {
  return (
    <Suspense fallback={null}>
      <EdgeBindingPageClient />
    </Suspense>
  );
}
