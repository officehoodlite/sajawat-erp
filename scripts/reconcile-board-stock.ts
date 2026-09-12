/**
 * Rebuilds BoardInventory.remainingSqft from purchases − admin LotActualBoardEntry usage.
 * Run: npx tsx scripts/reconcile-board-stock.ts
 */
import { prisma } from "../lib/prisma";
import { reconcileBoardThicknessRemaining } from "../lib/manufacturing-stock";
import { roundDecimal } from "../lib/decimal";
import { toNumber } from "../lib/mappers";

async function main() {
  const thicknesses = await prisma.boardThickness.findMany({
    include: { board: true },
    orderBy: [{ board: { materialName: "asc" } }, { thickness: "asc" }],
  });

  console.log(`Reconciling board stock for ${thicknesses.length} thicknesses...\n`);

  await prisma.$transaction(async (tx) => {
    for (const thickness of thicknesses) {
      await reconcileBoardThicknessRemaining(tx, thickness.id);
    }
  });

  for (const thickness of thicknesses) {
    const [purchasedAgg, usedAgg, remainingAgg] = await Promise.all([
      prisma.boardInventory.aggregate({
        where: { boardThicknessId: thickness.id },
        _sum: { purchaseSqft: true },
      }),
      prisma.lotActualBoardEntry.aggregate({
        where: { boardThicknessId: thickness.id },
        _sum: { totalSqft: true },
      }),
      prisma.boardInventory.aggregate({
        where: { boardThicknessId: thickness.id },
        _sum: { remainingSqft: true },
      }),
    ]);
    const purchased = roundDecimal(toNumber(purchasedAgg._sum.purchaseSqft));
    const used = roundDecimal(toNumber(usedAgg._sum.totalSqft));
    const remaining = roundDecimal(toNumber(remainingAgg._sum.remainingSqft));
    if (purchased === 0 && used === 0) continue;
    console.log(
      `  ${thickness.board.materialName} ${thickness.thickness}: purchased ${purchased}, used ${used}, remaining ${remaining}`
    );
  }

  console.log("\nDone. Available stock = purchases − admin actual usage.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
