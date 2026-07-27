import { Suspense } from "react";
import { BoardsPageClient } from "@/features/inventory/components/boards-page";

export default function BoardsPage() {
  return (
    <Suspense fallback={null}>
      <BoardsPageClient />
    </Suspense>
  );
}
