#!/usr/bin/env tsx
/**
 * Bible Data Ingestion Script
 * Fetches and ingests Bible data from Bolls Life API
 *
 * Usage: npx tsx scripts/ingest-bible-data.ts
 */

import { PrismaClient } from '@prisma/client';
import {
  generateVerseId,
  BIBLE_BOOKS,
  getChapter,
  getBollsBookId,
} from '../lib/bible';

const prisma = new PrismaClient();

// Translations to ingest
const TRANSLATIONS = [
  { id: 'kjv', field: 'textKjv' },
  { id: 'web', field: 'textWeb' },
  { id: 'asv', field: 'textAsv' },
  { id: 'bbe', field: 'textBbe' },
  { id: 'ylt', field: 'textYlt' },
] as const;

interface IngestionStats {
  booksProcessed: number;
  versesCreated: number;
  versesUpdated: number;
  versesFailed: number;
  translationsCompleted: number;
}

const stats: IngestionStats = {
  booksProcessed: 0,
  versesCreated: 0,
  versesUpdated: 0,
  versesFailed: 0,
  translationsCompleted: 0,
};

/**
 * Seed books table
 */
async function seedBooks() {
  console.log('📚 Seeding books table...');

  for (const book of BIBLE_BOOKS) {
    await prisma.book.upsert({
      where: { id: book.id },
      update: {
        name: book.name,
        slug: book.slug,
        testament: book.testament,
        genre: book.genre,
        chapters: book.chapters,
        verses: book.verses,
      },
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
 * Create ingestion log
 */
async function createIngestionLog(translation: string) {
  return await prisma.ingestionLog.create({
    data: {
      source: 'bolls_api',
      operation: `import_verses_${translation}`,
      status: 'in_progress',
    },
  });
}

/**
 * Update ingestion log
 */
async function updateIngestionLog(
  logId: string,
  status: 'completed' | 'failed',
  error?: string
) {
  await prisma.ingestionLog.update({
    where: { id: logId },
    data: {
      status,
      completedAt: new Date(),
      recordsProcessed: stats.versesCreated + stats.versesUpdated,
      recordsFailed: stats.versesFailed,
      errorMessage: error,
    },
  });
}

/**
 * Ingest verses for a specific translation
 */
async function ingestTranslation(
  translationId: string,
  translationField: string
) {
  console.log(`\n📖 Ingesting ${translationId.toUpperCase()} translation...`);

  const log = await createIngestionLog(translationId);

  try {
    for (const book of BIBLE_BOOKS) {
      const bollsBookId = getBollsBookId(book.id);

      if (!bollsBookId) {
        console.error(`❌ Could not map book ID ${book.id} to Bolls ID`);
        continue;
      }

      console.log(`  Processing ${book.name} (${book.chapters} chapters)...`);

      // Fetch each chapter
      for (let chapter = 1; chapter <= book.chapters; chapter++) {
        try {
          // Fetch chapter from Bolls API
          const verses = await getChapter(translationId, bollsBookId, chapter);

          if (!verses || verses.length === 0) {
            console.warn(`    ⚠️  No verses found for ${book.name} ${chapter}`);
            continue;
          }

          // Process each verse
          for (const verse of verses) {
            try {
              const verseId = generateVerseId(book.id, chapter, verse.verse);

              // Check if verse exists
              const existingVerse = await prisma.verse.findUnique({
                where: { id: verseId },
              });

              if (existingVerse) {
                // Update with new translation
                await prisma.verse.update({
                  where: { id: verseId },
                  data: {
                    [translationField]: verse.text,
                  },
                });
                stats.versesUpdated++;
              } else {
                // Create new verse
                await prisma.verse.create({
                  data: {
                    id: verseId,
                    bookId: book.id,
                    chapter,
                    verseNumber: verse.verse,
                    [translationField]: verse.text,
                    wordsCount: verse.text.split(/\s+/).length,
                  },
                });
                stats.versesCreated++;
              }
            } catch (error) {
              console.error(
                `    ❌ Failed to process ${book.name} ${chapter}:${verse.verse}:`,
                error instanceof Error ? error.message : error
              );
              stats.versesFailed++;
            }
          }

          // Progress indicator
          if (chapter % 10 === 0) {
            console.log(`    ✓ Processed ${chapter}/${book.chapters} chapters`);
          }

          // Rate limiting - wait 100ms between chapters
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(
            `    ❌ Failed to fetch ${book.name} ${chapter}:`,
            error instanceof Error ? error.message : error
          );
        }
      }

      console.log(`  ✅ Completed ${book.name}`);
      stats.booksProcessed++;
    }

    stats.translationsCompleted++;
    await updateIngestionLog(log.id, 'completed');
    console.log(`✅ Completed ${translationId.toUpperCase()} translation`);
  } catch (error) {
    await updateIngestionLog(
      log.id,
      'failed',
      error instanceof Error ? error.message : 'Unknown error'
    );
    console.error(`❌ Failed to ingest ${translationId}:`, error);
  }
}

/**
 * Main ingestion function
 */
async function main() {
  console.log('🚀 Starting Bible data ingestion...\n');
  console.log('This process will:');
  console.log('  1. Seed the books table');
  console.log('  2. Fetch verses from Bolls Life API');
  console.log('  3. Ingest 5 English translations (KJV, WEB, ASV, BBE, YLT)');
  console.log('  4. Track progress in ingestion logs\n');

  const startTime = Date.now();

  try {
    // Step 1: Seed books
    await seedBooks();

    // Step 2: Ingest each translation
    for (const translation of TRANSLATIONS) {
      // Reset book counter for each translation
      stats.booksProcessed = 0;

      await ingestTranslation(translation.id, translation.field);

      // Summary for this translation
      console.log(`\n📊 ${translation.id.toUpperCase()} Summary:`);
      console.log(`   Books processed: ${stats.booksProcessed}`);
      console.log(`   Verses created: ${stats.versesCreated}`);
      console.log(`   Verses updated: ${stats.versesUpdated}`);
      console.log(`   Verses failed: ${stats.versesFailed}\n`);
    }

    // Final summary
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('\n✅ Ingestion completed successfully!');
    console.log('\n📊 Final Statistics:');
    console.log(`   Translations completed: ${stats.translationsCompleted}/5`);
    console.log(`   Total verses created: ${stats.versesCreated}`);
    console.log(`   Total verses updated: ${stats.versesUpdated}`);
    console.log(`   Total verses failed: ${stats.versesFailed}`);
    console.log(`   Duration: ${duration}s`);
  } catch (error) {
    console.error('\n❌ Ingestion failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
