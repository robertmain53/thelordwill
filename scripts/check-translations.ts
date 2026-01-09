#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL || '';
const urlWithoutCache = databaseUrl.includes('?')
  ? `${databaseUrl}&pgbouncer=true&statement_cache_size=0`
  : `${databaseUrl}?pgbouncer=true&statement_cache_size=0`;

const prisma = new PrismaClient({
  datasources: { db: { url: urlWithoutCache } },
});

async function main() {
  console.log('📊 Checking multi-language translation progress...\n');

  try {
    const total = await prisma.verse.count();
    const withSpanish = await prisma.verse.count({
      where: { textRV: { not: null } },
    });
    const withPortuguese = await prisma.verse.count({
      where: { textBL: { not: null } },
    });

    console.log(`Total verses: ${total.toLocaleString()}`);
    console.log(`\nSpanish (Reina Valera 1909):`);
    console.log(`  ✓ ${withSpanish.toLocaleString()} verses (${Math.round((withSpanish / total) * 100)}%)`);
    console.log(`\nPortuguese (Bíblia Livre):`);
    console.log(`  ✓ ${withPortuguese.toLocaleString()} verses (${Math.round((withPortuguese / total) * 100)}%)`);

    if (withSpanish === total && withPortuguese === total) {
      console.log('\n🎉 Multi-language ingestion complete!');
    } else if (withSpanish > 0 || withPortuguese > 0) {
      console.log('\n⚠️  Ingestion incomplete or in progress');
    } else {
      console.log('\n❌ No translations found - ingestion may have failed');
    }
  } catch (error) {
    console.error('Error checking translations:', error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
