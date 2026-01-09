#!/usr/bin/env tsx
/**
 * Quick script to check if Book table is populated
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const bookCount = await prisma.book.count();
    const verseCount = await prisma.verse.count();

    console.log('\n📊 Database Status:');
    console.log(`  Books: ${bookCount} (expected: 66)`);
    console.log(`  Verses: ${verseCount.toLocaleString()} (expected: ~31,000)`);

    if (bookCount === 0) {
      console.log('\n❌ Book table is EMPTY!');
      console.log('   This is likely why routes are returning 404.');
      console.log('\n💡 Fix: Run "npm run seed:books" to populate Book table');
    } else if (bookCount < 66) {
      console.log(`\n⚠️  Incomplete: ${66 - bookCount} books missing`);
    } else {
      console.log('\n✅ Book table is complete');
    }

    if (verseCount === 0) {
      console.log('\n❌ Verse table is EMPTY!');
      console.log('   You need to run Bible ingestion.');
      console.log('\n💡 Fix: Run "npm run ingest:bible" (takes ~1 hour)');
    } else if (verseCount < 31000) {
      console.log(`\n⚠️  Incomplete: ${31000 - verseCount} verses missing (approximately)`);
    } else {
      console.log('✅ Verse table has data');
    }

    // Sample a few books to verify
    if (bookCount > 0) {
      console.log('\n📚 Sample books:');
      const sampleBooks = await prisma.book.findMany({
        take: 5,
        select: { id: true, name: true, slug: true },
      });
      sampleBooks.forEach(book => {
        console.log(`  ${book.id}. ${book.name} (${book.slug})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
