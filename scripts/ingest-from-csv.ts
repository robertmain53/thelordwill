#!/usr/bin/env tsx
/**
 * Bible CSV Ingestion Script
 * Downloads and imports public domain Bible translations from ScrollMapper
 * Source: https://github.com/scrollmapper/bible_databases
 *
 * Translations:
 * - KJV (King James Version)
 * - WEB (World English Bible)
 * - ASV (American Standard Version)
 * - BBE (Bible in Basic English)
 * - YLT (Young's Literal Translation)
 *
 * All are PUBLIC DOMAIN - safe for commercial use
 *
 * Usage: npx tsx scripts/ingest-from-csv.ts
 */

import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { generateVerseId, BIBLE_BOOKS, getBookByName } from '../lib/bible';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const CSV_DIR = path.join(process.cwd(), 'data', 'csv');
const GITHUB_BASE = 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/csv';

// Translations to download and import
const TRANSLATIONS = [
  { id: 'kjv', file: 'KJV.csv', field: 'textKjv', name: 'King James Version' },
  { id: 'asv', file: 'ASV.csv', field: 'textAsv', name: 'American Standard Version' },
  { id: 'bbe', file: 'BBE.csv', field: 'textBbe', name: 'Bible in Basic English' },
  { id: 'ylt', file: 'YLT.csv', field: 'textYlt', name: "Young's Literal Translation" },
  { id: 'web', file: 'Webster.csv', field: 'textWeb', name: 'Webster Bible' },
] as const;

interface CSVRow {
  book: string;    // Book name (e.g., "Genesis")
  chapter: number; // Chapter number
  verse: number;   // Verse number
  text: string;    // Verse text
}

interface IngestionStats {
  downloaded: number;
  booksSeeded: number;
  versesCreated: number;
  versesUpdated: number;
  translationsCompleted: number;
}

const stats: IngestionStats = {
  downloaded: 0,
  booksSeeded: 0,
  versesCreated: 0,
  versesUpdated: 0,
  translationsCompleted: 0,
};

function createPrismaClient(databaseUrl: string) {
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
}

function isConnectionClosedError(error: unknown): boolean {
  if (error instanceof PrismaClientKnownRequestError) {
    return error.code === 'P1017';
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message?: string }).message || '');
    return message.includes('Server has closed the connection');
  }

  return false;
}

async function upsertVerseWithRetry(
  prisma: PrismaClient,
  data: Prisma.VerseUpsertArgs
) {
  let attempt = 0;
  const maxAttempts = 2;

  while (attempt < maxAttempts) {
    try {
      await prisma.verse.upsert(data);
      return;
    } catch (error) {
      attempt += 1;
      if (attempt >= maxAttempts || !isConnectionClosedError(error)) {
        throw error;
      }

      try {
        await prisma.$disconnect();
      } catch {
        // ignore disconnect errors during retry
      }
      await prisma.$connect();
    }
  }
}

/**
 * Ensure CSV directory exists
 */
async function ensureDirectory() {
  if (!fs.existsSync(CSV_DIR)) {
    fs.mkdirSync(CSV_DIR, { recursive: true });
    console.log(`📁 Created directory: ${CSV_DIR}\n`);
  }
}

/**
 * Download CSV file from GitHub
 */
async function downloadCSV(translation: typeof TRANSLATIONS[number]): Promise<boolean> {
  const localPath = path.join(CSV_DIR, translation.file);

  // Skip if already downloaded
  if (fs.existsSync(localPath)) {
    console.log(`  ✓ Already downloaded: ${translation.file}`);
    return true;
  }

  const url = `${GITHUB_BASE}/${translation.file}`;
  console.log(`  Downloading ${translation.name}...`);

  try {
    const { stdout, stderr } = await execAsync(`curl -L -o "${localPath}" "${url}"`);

    if (stderr && !stderr.includes('curl')) {
      console.error(`  Error: ${stderr}`);
      return false;
    }

    // Verify file was downloaded and has content
    const fileSize = fs.statSync(localPath).size;
    if (fileSize < 1000) {
      console.error(`  Error: Downloaded file is too small (${fileSize} bytes)`);
      fs.unlinkSync(localPath);
      return false;
    }

    console.log(`  ✓ Downloaded: ${translation.file} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
    stats.downloaded++;
    return true;
  } catch (error) {
    console.error(`  ✗ Failed to download ${translation.file}:`, error);
    return false;
  }
}

/**
 * Seed books table
 */
async function seedBooks(prisma: PrismaClient) {
  console.log('\n📚 Seeding books table...');

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

  stats.booksSeeded = BIBLE_BOOKS.length;
  console.log(`✅ Seeded ${BIBLE_BOOKS.length} books\n`);
}

/**
 * Normalize book name from CSV (handles Roman numerals)
 */
function normalizeBookName(bookName: string): string {
  const cleaned = bookName.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

  const aliasMap: Record<string, string> = {
    'revelation of john': 'Revelation',
  };

  const aliasKey = cleaned.toLowerCase();
  if (aliasMap[aliasKey]) {
    return aliasMap[aliasKey];
  }

  // Normalize Roman numerals (I, II, III) at the start of the book name.
  const romanMatch = cleaned.match(/^(III|II|I)\s+(.+)$/i);
  if (romanMatch) {
    const roman = romanMatch[1].toUpperCase();
    const rest = romanMatch[2].trim();
    const romanToArabic: Record<string, string> = {
      I: '1',
      II: '2',
      III: '3',
    };
    return `${romanToArabic[roman]} ${rest}`;
  }

  return cleaned;
}

/**
 * Parse CSV file and return rows
 */
async function parseCSV(filePath: string): Promise<CSVRow[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').slice(1); // Skip header: Book,Chapter,Verse,Text
  const rows: CSVRow[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    // CSV format: Book,Chapter,Verse,Text
    // Example: Genesis,1,1,"In the beginning God created the heaven and the earth."
    // Handle quoted text with possible commas inside
    const match = line.match(/^([^,]+),(\d+),(\d+),"(.+)"$/);

    if (!match) {
      // Try alternative format without quotes
      const altMatch = line.match(/^([^,]+),(\d+),(\d+),(.+)$/);
      if (!altMatch) continue;

      const [, book, chapter, verse, text] = altMatch;
      rows.push({
        book: book.trim(),
        chapter: parseInt(chapter),
        verse: parseInt(verse),
        text: text.trim(),
      });
      continue;
    }

    const [, book, chapter, verse, text] = match;
    rows.push({
      book: book.trim(),
      chapter: parseInt(chapter),
      verse: parseInt(verse),
      text: text.replace(/""/g, '"'), // Unescape doubled quotes
    });
  }

  return rows;
}

/**
 * Import translation from CSV
 */
async function importTranslation(prisma: PrismaClient, translation: typeof TRANSLATIONS[number]) {
  const filePath = path.join(CSV_DIR, translation.file);

  console.log(`\n📖 Importing ${translation.name}...`);

  const log = await prisma.ingestionLog.create({
    data: {
      source: 'scrollmapper_csv',
      operation: `import_${translation.id}`,
      status: 'in_progress',
    },
  });

  try {
    // Parse CSV
    console.log('  Parsing CSV file...');
    const rows = await parseCSV(filePath);
    console.log(`  ✓ Parsed ${rows.length.toLocaleString()} verses`);

    // Import verses sequentially to avoid connection pooling issues
    console.log('  Importing to database...');
    let processed = 0;

    for (const row of rows) {
      try {
        // Map book name to book ID (normalize Roman numerals first)
        const normalizedName = normalizeBookName(row.book);
        const book = getBookByName(normalizedName);
        if (!book) {
          console.error(`    Unknown book name: ${row.book} (normalized: ${normalizedName})`);
          continue;
        }

        const verseId = generateVerseId(book.id, row.chapter, row.verse);
        const cleanText = row.text.trim();

        // Upsert verse
        await upsertVerseWithRetry(prisma, {
          where: { id: verseId },
          update: {
            [translation.field]: cleanText,
            wordsCount: cleanText.split(/\s+/).length,
          },
          create: {
            id: verseId,
            bookId: book.id,
            chapter: row.chapter,
            verseNumber: row.verse,
            [translation.field]: cleanText,
            wordsCount: cleanText.split(/\s+/).length,
          },
        });

        stats.versesCreated++;
        processed++;

        // Progress indicator
        if (processed % 1000 === 0) {
          console.log(`  Progress: ${processed.toLocaleString()}/${rows.length.toLocaleString()} verses`);
        }
      } catch (error) {
        console.error(`    Error importing verse ${row.book} ${row.chapter}:${row.verse}:`, error);
      }
    }

    stats.translationsCompleted++;

    await prisma.ingestionLog.update({
      where: { id: log.id },
      data: {
        status: 'completed',
        recordsProcessed: rows.length,
        completedAt: new Date(),
      },
    });

    console.log(`✅ Completed ${translation.name} (${rows.length.toLocaleString()} verses)`);
  } catch (error) {
    console.error(`❌ Failed to import ${translation.name}:`, error);

    await prisma.ingestionLog.update({
      where: { id: log.id },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    });
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Bible CSV Ingestion from ScrollMapper\n');
  console.log('Source: https://github.com/scrollmapper/bible_databases');
  console.log('License: Public Domain (safe for commercial use)\n');
  console.log('This will:');
  console.log('  1. Download 5 CSV files (~25 MB total)');
  console.log('  2. Seed the books table');
  console.log('  3. Import ~155,000 verses (5 translations × 31,000 verses)');
  console.log('  4. Store in PostgreSQL database\n');
  console.log('⏱️  Estimated time: 15-30 minutes (sequential processing for stability)\n');

  // Disable prepared statements to avoid caching conflicts
  const databaseUrl = process.env.DATABASE_URL || '';
  const urlWithoutCache = databaseUrl.includes('?')
    ? `${databaseUrl}&pgbouncer=true&statement_cache_size=0`
    : `${databaseUrl}?pgbouncer=true&statement_cache_size=0`;

  try {
    // Ensure directory exists
    await ensureDirectory();

    // Download CSV files
    console.log('📥 Downloading CSV files...\n');
    for (const translation of TRANSLATIONS) {
      await downloadCSV(translation);
    }

    // Seed books
    const prisma = createPrismaClient(urlWithoutCache);
    await prisma.$connect();
    await seedBooks(prisma);
    await prisma.$disconnect();

    // Import translations with a fresh connection per translation
    for (const translation of TRANSLATIONS) {
      const prisma = createPrismaClient(urlWithoutCache);
      await prisma.$connect();
      await importTranslation(prisma, translation);
      await prisma.$disconnect();
    }

    // Final stats
    console.log('\n✅ Ingestion completed!\n');
    console.log('📊 Statistics:');
    console.log(`  Files downloaded: ${stats.downloaded}/5`);
    console.log(`  Books seeded: ${stats.booksSeeded}/66`);
    console.log(`  Verses imported: ${stats.versesCreated.toLocaleString()}`);
    console.log(`  Translations: ${stats.translationsCompleted}/5`);

    console.log('\n🎉 All done! You can now:');
    console.log('  - View data in Prisma Studio: npm run db:studio');
    console.log('  - Start development server: npm run dev');
    console.log('  - Create sample situations: npm run seed:situations (create this script)');
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
