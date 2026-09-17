import { PrismaClient } from "@/app/generated/prisma";

// Prevents exhausting the Postgres connection pool from hot-reloaded
// module instances during `next dev`. Standard Prisma + Next.js pattern.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
