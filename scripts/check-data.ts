#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

// Disable prepared statements for connection pooling compatibility
const databaseUrl = process.env.DATABASE_URL || '';
const urlWithoutCache = databaseUrl.includes('?')
  ? `${databaseUrl}&pgbouncer=true&statement_cache_size=0`
  : `${databaseUrl}?pgbouncer=true&statement_cache_size=0`;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: urlWithoutCache,
    },
  },
});

async function main() {
  console.log('📊 Checking database for existing data...\n');

  try {
    const situationCount = await prisma.situation.count();
    const professionCount = await prisma.profession.count();
    const nameCount = await prisma.name.count();
    const placeCount = await prisma.place.count();

    console.log(`Situations: ${situationCount}`);
    console.log(`Professions: ${professionCount}`);
    console.log(`Names: ${nameCount}`);
    console.log(`Places: ${placeCount}`);

    if (situationCount === 0 && professionCount === 0 && nameCount === 0) {
      console.log('\n⚠️  No programmatic content found!');
      console.log('The dynamic routes will return 404 until data is seeded.');
    }
  } catch (error) {
    console.error('Error checking data:', error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
