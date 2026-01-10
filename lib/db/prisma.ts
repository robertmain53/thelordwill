import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Add pgbouncer parameter to connection string for pooled connections
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;

  // Add pgbouncer=true parameter if using Supabase pooler and not already present
  if (url.includes('pooler.supabase.com') && !url.includes('pgbouncer=true')) {
    const separator = url.includes('?') ? '&' : '?';
    return url + separator + 'pgbouncer=true';
  }
  return url;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
