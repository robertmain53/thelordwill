#!/usr/bin/env tsx
/**
 * Multi-Language Bible Ingestion Script
 * Downloads and imports Spanish and Portuguese translations from ScrollMapper
 * Source: https://github.com/scrollmapper/bible_databases
 *
 * Translations:
 * - SpaRV (Reina Valera 1909) - Spanish
 * - PorBLivre (Bíblia Livre) - Portuguese
 *
 * All are PUBLIC DOMAIN - safe for commercial use
 *
 * Usage: npx tsx scripts/ingest-multilang.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { generateVerseId, getBookByName } from '../lib/bible';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const CSV_DIR = path.join(process.cwd(), 'data', 'csv');
const GITHUB_BASE = 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/csv';

// Translations to download and import
const TRANSLATIONS = [
  { id: 'rv', file: 'SpaRV.csv', field: 'textRV', name: 'Reina Valera 1909', lang: 'es' },
  { id: 'bl', file: 'PorBLivre.csv', field: 'textBL', name: 'Bíblia Livre', lang: 'pt' },
] as const;

interface CSVRow {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

interface IngestionStats {
  downloaded: number;
  versesUpdated: number;
  translationsCompleted: number;
}

const stats: IngestionStats = {
  downloaded: 0,
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
  updateData: {
    where: { id: number };
    data: Record<string, unknown>;
  }
) {
  let attempt = 0;
  const maxAttempts = 2;

  while (attempt < maxAttempts) {
    try {
      await prisma.verse.update(updateData);
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
 * Import translation from CSV using OPTIMIZED batch updates
 */
async function importTranslation(prisma: PrismaClient, translation: typeof TRANSLATIONS[number]) {
  const filePath = path.join(CSV_DIR, translation.file);

  console.log(`\n📖 Importing ${translation.name} (${translation.lang})...`);

  const log = await prisma.ingestionLog.create({
    data: {
      source: 'scrollmapper_csv_multilang',
      operation: `import_${translation.id}`,
      status: 'in_progress',
    },
  });

  try {
    // Parse CSV
    console.log('  Parsing CSV file...');
    const rows = await parseCSV(filePath);
    console.log(`  ✓ Parsed ${rows.length.toLocaleString()} verses`);

    // Prepare batch data
    console.log('  Preparing batch updates...');
    const updates: Array<{ id: number; text: string }> = [];

    for (const row of rows) {
      try {
        const normalizedName = normalizeBookName(row.book);
        const book = getBookByName(normalizedName);
        if (!book) {
          console.error(`    Unknown book name: ${row.book} (normalized: ${normalizedName})`);
          continue;
        }

        const verseId = generateVerseId(book.id, row.chapter, row.verse);
        const cleanText = row.text.trim();
        updates.push({ id: verseId, text: cleanText });
      } catch (error) {
        console.error(`    Error preparing verse ${row.book} ${row.chapter}:${row.verse}:`, error);
      }
    }

    console.log(`  ✓ Prepared ${updates.length.toLocaleString()} updates`);
    console.log('  Importing to database in batches...');

    // Batch size for optimal performance
    const BATCH_SIZE = 500;
    let processed = 0;

    // Process in batches using raw SQL for speed
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);

      // Build CASE statement for batch update
      const caseStatement = batch
        .map(({ id, text }) => {
          const escapedText = text.replace(/'/g, "''");
          return `WHEN ${id} THEN '${escapedText}'`;
        })
        .join(' ');

      const ids = batch.map(({ id }) => id).join(',');

      // Execute batch update using raw SQL
      const query = `
        UPDATE "Verse"
        SET "${translation.field}" = CASE "id"
          ${caseStatement}
        END
        WHERE "id" IN (${ids})
      `;

      try {
        await prisma.$executeRawUnsafe(query);
      } catch (error) {
        // If raw SQL fails, fall back to transaction with individual updates
        console.log(`  ⚠ Batch failed, retrying individually...`);
        await prisma.$transaction(
          batch.map(({ id, text }) =>
            prisma.verse.update({
              where: { id },
              data: { [translation.field]: text },
            })
          )
        );
      }

      processed += batch.length;
      stats.versesUpdated += batch.length;

      // Progress indicator
      if (processed % 5000 === 0 || processed === updates.length) {
        console.log(`  Progress: ${processed.toLocaleString()}/${updates.length.toLocaleString()} verses`);
      }
    }

    stats.translationsCompleted++;

    await prisma.ingestionLog.update({
      where: { id: log.id },
      data: {
        status: 'completed',
        recordsProcessed: updates.length,
        completedAt: new Date(),
      },
    });

    console.log(`✅ Completed ${translation.name} (${updates.length.toLocaleString()} verses)`);
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
  console.log('🌍 Multi-Language Bible Ingestion from ScrollMapper\n');
  console.log('Source: https://github.com/scrollmapper/bible_databases');
  console.log('License: Public Domain (safe for commercial use)\n');
  console.log('This will:');
  console.log('  1. Download Spanish (Reina Valera 1909) and Portuguese (Bíblia Livre) CSV files');
  console.log('  2. Update existing verses with Spanish and Portuguese translations (OPTIMIZED BATCH MODE)');
  console.log('  3. Store in PostgreSQL database\n');
  console.log('⏱️  Estimated time: 2-3 minutes (50x faster with batch updates)\n');

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
    console.log(`  Files downloaded: ${stats.downloaded}/2`);
    console.log(`  Verses updated: ${stats.versesUpdated.toLocaleString()}`);
    console.log(`  Translations: ${stats.translationsCompleted}/2`);

    console.log('\n🎉 All done! You can now:');
    console.log('  - View data in Prisma Studio: npm run db:studio');
    console.log('  - Start development server: npm run dev');
    console.log('  - Access Spanish pages: /es/bible-verses-for-[situation]');
    console.log('  - Access Portuguese pages: /pt/bible-verses-for-[situation]');
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
