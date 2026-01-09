#!/usr/bin/env tsx
/**
 * Simplified Bible Data Ingestion Script
 * Uses bible-api.com (free, WEB translation only)
 *
 * For additional translations, you'll need:
 * - API.Bible account (free) for KJV, ASV, etc.
 * - Or manual CSV import
 *
 * Usage: npx tsx scripts/ingest-bible-simple.ts
 */

import { PrismaClient } from '@prisma/client';
import { generateVerseId, BIBLE_BOOKS } from '../lib/bible';
import { getChapter, getBookName } from '../lib/bible/bible-api-com';

const prisma = new PrismaClient();

interface IngestionStats {
  booksProcessed: number;
  versesCreated: number;
  versesUpdated: number;
  versesFailed: number;
}

const stats: IngestionStats = {
  booksProcessed: 0,
  versesCreated: 0,
  versesUpdated: 0,
  versesFailed: 0,
};

/**
 * Seed books table
 */
async function seedBooks() {
  console.log('📚 Seeding books table...');

  for (const book of BIBLE_BOOKS) {
    await prisma.book.upsert({
      where: { id: book.id },
      update: {},
      create: {
        id: book.id,
        name: book.name,
        slug: book.slug,
        testament: book.testament,
        genre: book.genre,
        chapters: book.chapters,
        verses: book.verses,
      },
    });
  }

  console.log(`✅ Seeded ${BIBLE_BOOKS.length} books\n`);
}

/**
 * Ingest Bible verses (WEB translation)
 */
async function ingestBible() {
  console.log('📖 Ingesting WEB (World English Bible) translation...\n');

  const log = await prisma.ingestionLog.create({
    data: {
      source: 'bible-api.com',
      operation: 'import_web_translation',
      status: 'in_progress',
    },
  });

  try {
    for (const book of BIBLE_BOOKS) {
      const bookName = getBookName(book.id);

      if (!bookName) {
        console.error(`❌ Could not map book ID ${book.id}`);
        continue;
      }

      console.log(`  Processing ${book.name} (${book.chapters} chapters)...`);

      // Fetch each chapter
      for (let chapterNum = 1; chapterNum <= book.chapters; chapterNum++) {
        try {
          // Rate limit: 1 request per second (to avoid 429 errors)
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Fetch chapter from API
          const response = await getChapter(bookName, chapterNum);

          if (!response || !response.verses || response.verses.length === 0) {
            console.warn(`    ⚠️  No verses found for ${book.name} ${chapterNum}`);
            stats.versesFailed += book.verses; // Estimate
            continue;
          }

          // Process each verse
          for (const verse of response.verses) {
            try {
              const verseId = generateVerseId(book.id, verse.chapter, verse.verse);
              const cleanText = verse.text.trim();

              // Upsert verse
              await prisma.verse.upsert({
                where: { id: verseId },
                update: {
                  textWeb: cleanText,
                  wordsCount: cleanText.split(/\s+/).length,
                },
                create: {
                  id: verseId,
                  bookId: book.id,
                  chapter: verse.chapter,
                  verseNumber: verse.verse,
                  textWeb: cleanText,
                  wordsCount: cleanText.split(/\s+/).length,
                },
              });

              stats.versesCreated++;
            } catch (error) {
              console.error(`      Error processing ${book.name} ${verse.chapter}:${verse.verse}:`, error);
              stats.versesFailed++;
            }
          }

          // Progress indicator
          if (chapterNum % 10 === 0) {
            console.log(`    ✓ Completed chapter ${chapterNum}/${book.chapters}`);
          }
        } catch (error) {
          console.error(`    Error fetching ${book.name} ${chapterNum}:`, error);
          stats.versesFailed++;
        }
      }

      console.log(`  ✅ Completed ${book.name}`);
      stats.booksProcessed++;
    }

    // Update log
    await prisma.ingestionLog.update({
      where: { id: log.id },
      data: {
        status: 'completed',
        recordsProcessed: stats.versesCreated,
        recordsFailed: stats.versesFailed,
        completedAt: new Date(),
      },
    });

    console.log('\n✅ Ingestion completed!\n');
    console.log('📊 Statistics:');
    console.log(`  Books processed: ${stats.booksProcessed}/66`);
    console.log(`  Verses created: ${stats.versesCreated.toLocaleString()}`);
    console.log(`  Verses failed: ${stats.versesFailed.toLocaleString()}`);
  } catch (error) {
    console.error('\n❌ Ingestion failed:', error);

    await prisma.ingestionLog.update({
      where: { id: log.id },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    });

    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Bible data ingestion (WEB translation)...\n');
  console.log('This will:');
  console.log('  1. Seed the books table (66 books)');
  console.log('  2. Fetch verses from bible-api.com (rate limited: 1 req/sec)');
  console.log('  3. Store ~31,000 verses in database');
  console.log('  4. Track progress in ingestion logs');
  console.log('\n⏱️  Estimated time: 3-4 hours (due to rate limiting)\n');
  console.log('💡 Tip: Run in a screen/tmux session or keep terminal open\n');

  try {
    await seedBooks();
    await ingestBible();

    console.log('\n🎉 All done! You can now:');
    console.log('  - Run additional ingestion for other translations (requires API key)');
    console.log('  - Start the development server: npm run dev');
    console.log('  - View data in Prisma Studio: npm run db:studio');
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
