import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_USERNAME = "admin@sajawat";
const ADMIN_PASSWORD = "sajawat@12345";

async function main() {
  const removed = await prisma.user.deleteMany();
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await prisma.user.create({
    data: {
      username: ADMIN_USERNAME,
      passwordHash,
      role: "ADMIN",
      isActive: true,
      permissions: { workerPrices: true },
    },
  });
  console.log(`Removed ${removed.count} user(s). Admin ready: ${ADMIN_USERNAME}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
