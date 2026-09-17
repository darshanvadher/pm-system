// Note: imports the generated client's client.ts directly, not the bare
// "@/app/generated/prisma" folder — that folder has no index.ts or
// package.json to redirect a bare import, per the generator's own output
// (its header comment says "you can import this file directly").
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 removed the old "just reads DATASOURCE url automatically"
// behavior — the client now requires an explicit driver adapter, even for
// a plain Postgres connection string. See https://pris.ly/d/driver-adapters
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Prevents exhausting the Postgres connection pool from hot-reloaded
// module instances during `next dev`. Standard Prisma + Next.js pattern.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

// Deliberately APP_ENV, not NODE_ENV: this machine's Windows environment
// has NODE_ENV permanently pinned to "production" system-wide, which would
// make this check always false and disable the dev-mode caching below —
// meaning every hot reload during `next dev` would open a brand new
// PrismaClient (and a brand new connection pool) instead of reusing one,
// eventually exhausting Postgres's max connections. APP_ENV is set
// explicitly in .env and defaults to "not production" when unset, which is
// the safe default for local dev.
if (process.env.APP_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
