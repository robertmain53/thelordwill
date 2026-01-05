#!/usr/bin/env tsx
/**
 * Strong's Numbers Ingestion Script
 * Maps Strong's Concordance numbers to the top 1,000 most popular verses
 *
 * Usage: npx tsx scripts/ingest-strongs.ts
 *
 * Note: This script uses sample data. In production, you would:
 * 1. Fetch Strong's data from a concordance API or dataset
 * 2. Use actual verse popularity data
 * 3. Parse interlinear Bibles for word-level mappings
 */

import { PrismaClient } from '@prisma/client';
import { generateVerseId } from '../lib/bible';

const prisma = new PrismaClient();

/**
 * Top 100 most popular Bible verses (sample)
 * In production, this would come from analytics data
 */
const POPULAR_VERSES = [
  { book: 43, chapter: 3, verse: 16 },    // John 3:16
  { book: 19, chapter: 23, verse: 1 },    // Psalm 23:1
  { book: 50, chapter: 4, verse: 13 },    // Philippians 4:13
  { book: 20, chapter: 3, verse: 5 },     // Proverbs 3:5
  { book: 20, chapter: 3, verse: 6 },     // Proverbs 3:6
  { book: 23, chapter: 41, verse: 10 },   // Isaiah 41:10
  { book: 24, chapter: 29, verse: 11 },   // Jeremiah 29:11
  { book: 40, chapter: 28, verse: 19 },   // Matthew 28:19
  { book: 45, chapter: 8, verse: 28 },    // Romans 8:28
  { book: 19, chapter: 46, verse: 1 },    // Psalm 46:1
  { book: 2, chapter: 14, verse: 14 },    // Exodus 14:14
  { book: 43, chapter: 14, verse: 6 },    // John 14:6
  { book: 50, chapter: 4, verse: 6 },     // Philippians 4:6
  { book: 50, chapter: 4, verse: 7 },     // Philippians 4:7
  { book: 1, chapter: 1, verse: 1 },      // Genesis 1:1
  { book: 40, chapter: 6, verse: 33 },    // Matthew 6:33
  { book: 19, chapter: 121, verse: 1 },   // Psalm 121:1
  { book: 19, chapter: 121, verse: 2 },   // Psalm 121:2
  { book: 58, chapter: 11, verse: 1 },    // Hebrews 11:1
  { book: 45, chapter: 12, verse: 2 },    // Romans 12:2
  // Add more verses up to 1,000 in production
];

/**
 * Sample Strong's Lexicon data
 * In production, import from a complete Strong's Concordance dataset
 */
const SAMPLE_STRONGS = [
  // Greek (New Testament)
  {
    strongsId: 'G26',
    originalWord: 'ἀγάπη',
    transliteration: 'agapē',
    definition: 'love, goodwill, esteem, benevolence',
    language: 'Greek',
  },
  {
    strongsId: 'G2316',
    originalWord: 'θεός',
    transliteration: 'theos',
    definition: 'God, a god, deity',
    language: 'Greek',
  },
  {
    strongsId: 'G4102',
    originalWord: 'πίστις',
    transliteration: 'pistis',
    definition: 'faith, belief, trust, confidence',
    language: 'Greek',
  },
  {
    strongsId: 'G5485',
    originalWord: 'χάρις',
    transliteration: 'charis',
    definition: 'grace, favor, kindness',
    language: 'Greek',
  },
  {
    strongsId: 'G4151',
    originalWord: 'πνεῦμα',
    transliteration: 'pneuma',
    definition: 'spirit, wind, breath',
    language: 'Greek',
  },

  // Hebrew (Old Testament)
  {
    strongsId: 'H3068',
    originalWord: 'יְהוָה',
    transliteration: 'YHWH',
    definition: 'the proper name of the God of Israel (Jehovah, LORD)',
    language: 'Hebrew',
  },
  {
    strongsId: 'H430',
    originalWord: 'אֱלֹהִים',
    transliteration: 'Elohim',
    definition: 'God, gods, judges, angels',
    language: 'Hebrew',
  },
  {
    strongsId: 'H157',
    originalWord: 'אָהַב',
    transliteration: 'ahab',
    definition: 'to love, like, be fond of',
    language: 'Hebrew',
  },
  {
    strongsId: 'H1697',
    originalWord: 'דָּבָר',
    transliteration: 'dabar',
    definition: 'word, matter, thing, speech',
    language: 'Hebrew',
  },
  {
    strongsId: 'H8064',
    originalWord: 'שָׁמַיִם',
    transliteration: 'shamayim',
    definition: 'heaven, sky',
    language: 'Hebrew',
  },
];

/**
 * Sample verse-to-Strong's mappings
 * In production, parse from interlinear Bible data
 */
const SAMPLE_VERSE_STRONGS_MAPPINGS = [
  // John 3:16 - "For God so loved the world..."
  { book: 43, chapter: 3, verse: 16, strongsId: 'G2316', position: 1 }, // God
  { book: 43, chapter: 3, verse: 16, strongsId: 'G26', position: 2 },   // loved
  { book: 43, chapter: 3, verse: 16, strongsId: 'G4102', position: 3 }, // believe

  // Genesis 1:1 - "In the beginning God created..."
  { book: 1, chapter: 1, verse: 1, strongsId: 'H430', position: 1 },    // God
  { book: 1, chapter: 1, verse: 1, strongsId: 'H8064', position: 2 },   // heaven

  // Psalm 23:1 - "The LORD is my shepherd..."
  { book: 19, chapter: 23, verse: 1, strongsId: 'H3068', position: 1 }, // LORD

  // Add more mappings in production
];

interface IngestionStats {
  strongsCreated: number;
  mappingsCreated: number;
  errors: number;
}

const stats: IngestionStats = {
  strongsCreated: 0,
  mappingsCreated: 0,
  errors: 0,
};

/**
 * Seed Strong's Lexicon
 */
async function seedStrongsLexicon() {
  console.log('📖 Seeding Strong\'s Lexicon...');

  for (const entry of SAMPLE_STRONGS) {
    try {
      await prisma.strongsLexicon.upsert({
        where: { strongsId: entry.strongsId },
        update: {
          originalWord: entry.originalWord,
          transliteration: entry.transliteration,
          definition: entry.definition,
          language: entry.language,
        },
        create: {
          strongsId: entry.strongsId,
          originalWord: entry.originalWord,
          transliteration: entry.transliteration,
          definition: entry.definition,
          language: entry.language,
        },
      });
      stats.strongsCreated++;
    } catch (error) {
      console.error(`❌ Failed to create Strong's entry ${entry.strongsId}:`, error);
      stats.errors++;
    }
  }

  console.log(`✅ Seeded ${stats.strongsCreated} Strong's entries\n`);
}

/**
 * Create verse-to-Strong's mappings
 */
async function createStrongsMappings() {
  console.log('🔗 Creating verse-to-Strong\'s mappings...');

  for (const mapping of SAMPLE_VERSE_STRONGS_MAPPINGS) {
    try {
      const verseId = generateVerseId(mapping.book, mapping.chapter, mapping.verse);

      // Check if verse exists
      const verse = await prisma.verse.findUnique({
        where: { id: verseId },
      });

      if (!verse) {
        console.warn(`⚠️  Verse ${verseId} not found, skipping mapping`);
        continue;
      }

      // Create mapping
      await prisma.verseStrong.create({
        data: {
          verseId,
          strongsId: mapping.strongsId,
          position: mapping.position,
        },
      });

      // Update occurrence count
      await prisma.strongsLexicon.update({
        where: { strongsId: mapping.strongsId },
        data: {
          occurrences: {
            increment: 1,
          },
        },
      });

      stats.mappingsCreated++;
    } catch (error) {
      // Ignore duplicate mapping errors
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        continue;
      }
      console.error(`❌ Failed to create mapping:`, error);
      stats.errors++;
    }
  }

  console.log(`✅ Created ${stats.mappingsCreated} verse-to-Strong's mappings\n`);
}

/**
 * Initialize verse popularity tracking
 */
async function initializeVersePopularity() {
  console.log('📊 Initializing verse popularity tracking...');

  let initialized = 0;

  for (const verse of POPULAR_VERSES) {
    try {
      const verseId = generateVerseId(verse.book, verse.chapter, verse.verse);

      await prisma.versePopularity.upsert({
        where: { verseId },
        update: {},
        create: {
          verseId,
          searchCount: 100, // Initial high count for popular verses
          viewCount: 500,
        },
      });

      initialized++;
    } catch (error) {
      console.error(`❌ Failed to initialize popularity for verse:`, error);
      stats.errors++;
    }
  }

  console.log(`✅ Initialized popularity tracking for ${initialized} verses\n`);
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting Strong\'s Numbers ingestion...\n');
  console.log('⚠️  NOTE: This is using sample data.');
  console.log('   In production, you would:');
  console.log('   1. Import complete Strong\'s Concordance dataset');
  console.log('   2. Parse interlinear Bible data for word mappings');
  console.log('   3. Use actual verse popularity analytics\n');

  const startTime = Date.now();

  try {
    // Create ingestion log
    const log = await prisma.ingestionLog.create({
      data: {
        source: 'strongs_import',
        operation: 'import_strongs_lexicon',
        status: 'in_progress',
      },
    });

    // Step 1: Seed Strong's Lexicon
    await seedStrongsLexicon();

    // Step 2: Create verse-to-Strong's mappings
    await createStrongsMappings();

    // Step 3: Initialize verse popularity
    await initializeVersePopularity();

    // Update log
    await prisma.ingestionLog.update({
      where: { id: log.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        recordsProcessed: stats.strongsCreated + stats.mappingsCreated,
        recordsFailed: stats.errors,
      },
    });

    // Final summary
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('✅ Strong\'s ingestion completed!\n');
    console.log('📊 Statistics:');
    console.log(`   Strong\'s entries created: ${stats.strongsCreated}`);
    console.log(`   Verse mappings created: ${stats.mappingsCreated}`);
    console.log(`   Errors: ${stats.errors}`);
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
