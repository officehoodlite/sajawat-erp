import { Suspense } from "react";
import { HardwarePageClient } from "@/features/inventory/components/hardware-page";

export default function HardwarePage() {
  return (
    <Suspense fallback={null}>
      <HardwarePageClient />
    </Suspense>
  );
}
