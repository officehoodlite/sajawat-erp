/**
 * Restores board inventory incorrectly deducted by carpenter (model) board entries.
 * Board stock should only reflect admin LotActualBoardEntry totals.
 *
 * Run: npx tsx scripts/reconcile-board-stock.ts
 */
import { prisma } from "../lib/prisma";
import { roundDecimal } from "../lib/decimal";
import { toNumber } from "../lib/mappers";

async function main() {
  const carpenterEntries = await prisma.manufacturingBoardEntry.findMany({
    select: {
      id: true,
      boardInventoryId: true,
      totalSqft: true,
      model: { select: { modelName: true, lot: { select: { lotNumber: true } } } },
    },
  });

  const restoreByInventory = new Map<string, number>();

  for (const entry of carpenterEntries) {
    const sqft = roundDecimal(toNumber(entry.totalSqft));
    if (sqft === 0) continue;
    restoreByInventory.set(
      entry.boardInventoryId,
      roundDecimal((restoreByInventory.get(entry.boardInventoryId) ?? 0) + sqft)
    );
  }

  if (restoreByInventory.size === 0) {
    console.log("No carpenter board entries found — nothing to restore.");
    return;
  }

  console.log(`Restoring carpenter deductions from ${carpenterEntries.length} model board entries:\n`);

  await prisma.$transaction(async (tx) => {
    for (const [inventoryId, sqft] of restoreByInventory) {
      const inventory = await tx.boardInventory.findUnique({
        where: { id: inventoryId },
        include: { boardThickness: { include: { board: true } } },
      });
      if (!inventory) {
        console.warn(`  Skip unknown inventory ${inventoryId}`);
        continue;
      }

      const before = roundDecimal(toNumber(inventory.remainingSqft));
      const after = roundDecimal(before + sqft);
      await tx.boardInventory.update({
        where: { id: inventoryId },
        data: { remainingSqft: after },
      });

      console.log(
        `  +${sqft} sqft → ${inventory.boardThickness.board.materialName} ${inventory.boardThickness.thickness} (${before} → ${after})`
      );
    }
  });

  const actualByThickness = await prisma.lotActualBoardEntry.groupBy({
    by: ["boardThicknessId"],
    _sum: { totalSqft: true },
  });

  console.log("\nAdmin actual usage net by thickness (should match stock impact):");
  for (const row of actualByThickness) {
    const thickness = await prisma.boardThickness.findUnique({
      where: { id: row.boardThicknessId },
      include: { board: true },
    });
    const label = thickness
      ? `${thickness.board.materialName} ${thickness.thickness}`
      : row.boardThicknessId;
    console.log(`  ${label}: ${roundDecimal(toNumber(row._sum.totalSqft))} sqft net`);
  }

  console.log("\nDone. Board stock now reflects admin actual usage only.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
