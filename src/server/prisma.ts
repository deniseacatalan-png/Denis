import { createRequire } from "node:module";

const globalForPrisma = globalThis as unknown as {
  prisma?: any;
};

const require = createRequire(import.meta.url);
let prisma: any = null;

export function getPrisma() {
  if (!prisma) {
    const { PrismaClient } = require("@prisma/client");
    const { PrismaPg } = require("@prisma/adapter-pg");
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      const error = new Error("Falta DATABASE_URL para conectar Prisma a Supabase Postgres.") as Error & {
        status?: number;
      };
      error.status = 500;
      throw error;
    }

    const adapter = new PrismaPg({ connectionString: databaseUrl });

    prisma =
      globalForPrisma.prisma ||
      new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
      });

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prisma;
    }
  }

  return prisma;
}
