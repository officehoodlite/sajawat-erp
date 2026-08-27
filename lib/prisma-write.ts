import { Prisma } from "@prisma/client";

export function rethrowPrismaWrite(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const err = new Error(
      error.code === "P2002"
        ? "Cannot save these materials because of a duplicate constraint. Apply pending database migrations if you added the same material more than once."
        : error.code === "P2003"
          ? "One of the selected materials no longer exists. Refresh the page and try again."
          : error.code === "P2021" || error.code === "P2022"
            ? "Database is missing tables for these materials. Run prisma migrate deploy, then try again."
            : "Could not save materials. Please try again."
    ) as Error & { statusCode?: number };
    err.statusCode = 400;
    throw err;
  }
  throw error;
}
