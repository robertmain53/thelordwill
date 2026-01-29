#!/usr/bin/env tsx
/**
 * generate-verse-embeddings.ts
 *
 * Idempotent script that generates embeddings for Bible verses and stores them
 * in VerseEmbedding via Prisma.
 *
 * Usage:
 *   pnpm embeddings:verses [options]
 *
 * Options:
 *   --model <name>     Embedding model (default: "text-embedding-3-small")
 *   --limit <n>        Max verses to process (default: 500, max: 1000)
 *   --sinceId <id>     Only process verses with id > sinceId
 *   --dry-run          Print plan without writing to DB
 *
 * The script is idempotent: it computes contentHash and skips rows where
 * an existing embedding has the same hash + model.
 */

import { PrismaClient } from "@prisma/client";
import {
  TRANSLATION_PRIORITY,
  createEmbeddingClient,
  processVerse,
  batch,
  type VerseRecord,
  type ProcessedVerse,
} from "./_embeddings-lib";

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_MODEL = "text-embedding-3-small";
const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 1000;
const EMBEDDING_BATCH_SIZE = 100; // OpenAI recommends batches of ~100

// ============================================================================
// CLI Argument Parsing
// ============================================================================

interface CliArgs {
  model: string;
  limit: number;
  sinceId: number | null;
  dryRun: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {
    model: DEFAULT_MODEL,
    limit: DEFAULT_LIMIT,
    sinceId: null,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--model" && args[i + 1]) {
      result.model = args[++i];
    } else if (arg === "--limit" && args[i + 1]) {
      const limit = parseInt(args[++i], 10);
      if (isNaN(limit) || limit < 1) {
        console.error("Error: --limit must be a positive integer");
        process.exit(1);
      }
      result.limit = Math.min(limit, MAX_LIMIT);
    } else if (arg === "--sinceId" && args[i + 1]) {
      const sinceId = parseInt(args[++i], 10);
      if (isNaN(sinceId)) {
        console.error("Error: --sinceId must be an integer");
        process.exit(1);
      }
      result.sinceId = sinceId;
    } else if (arg === "--dry-run") {
      result.dryRun = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
generate-verse-embeddings.ts

Generates embeddings for Bible verses and stores them in VerseEmbedding.

Usage:
  pnpm embeddings:verses [options]

Options:
  --model <name>     Embedding model (default: "${DEFAULT_MODEL}")
  --limit <n>        Max verses to process (default: ${DEFAULT_LIMIT}, max: ${MAX_LIMIT})
  --sinceId <id>     Only process verses with id > sinceId
  --dry-run          Print plan without writing to DB
  --help, -h         Show this help message

Examples:
  pnpm embeddings:verses --dry-run --limit 5
  pnpm embeddings:verses --limit 100
  pnpm embeddings:verses --sinceId 1000 --limit 500
`);
}

// ============================================================================
// Database Queries
// ============================================================================

/**
 * Build Prisma where clause for finding verses that need embeddings.
 */
function buildVerseWhereClause(sinceId: number | null): object {
  const hasText = {
    OR: TRANSLATION_PRIORITY.map((field) => ({
      [field]: { not: null },
    })),
  };

  if (sinceId !== null) {
    return {
      AND: [hasText, { id: { gt: sinceId } }],
    };
  }

  return hasText;
}

/**
 * Fetch verses that need embeddings for the given model.
 * A verse needs an embedding if:
 * 1. It has at least one non-null translation
 * 2. AND either no VerseEmbedding exists OR contentHash differs
 */
async function fetchVersesNeedingEmbeddings(
  prisma: PrismaClient,
  model: string,
  limit: number,
  sinceId: number | null
): Promise<VerseRecord[]> {
  // First, get verses with text that either have no embedding or outdated embedding
  const verses = await prisma.verse.findMany({
    where: buildVerseWhereClause(sinceId),
    select: {
      id: true,
      textKjv: true,
      textWeb: true,
      textAsv: true,
      textRV: true,
      textBL: true,
      embedding: {
        select: {
          model: true,
          contentHash: true,
        },
      },
    },
    orderBy: { id: "asc" },
    // Fetch more than limit to account for filtering
    take: limit * 2,
  });

  // Process and filter verses that actually need embeddings
  const needsEmbedding: VerseRecord[] = [];

  for (const verse of verses) {
    if (needsEmbedding.length >= limit) break;

    const processed = processVerse(verse, model);
    if (!processed) continue;

    // Check if embedding exists with same model and contentHash
    if (verse.embedding) {
      if (
        verse.embedding.model === model &&
        verse.embedding.contentHash === processed.contentHash
      ) {
        // Skip - already up to date
        continue;
      }
    }

    needsEmbedding.push(verse);
  }

  return needsEmbedding;
}

/**
 * Get existing embeddings for verses to check for updates.
 */
async function getExistingEmbeddings(
  prisma: PrismaClient,
  verseIds: number[],
  model: string
): Promise<Map<number, string>> {
  const existing = await prisma.verseEmbedding.findMany({
    where: {
      verseId: { in: verseIds },
      model: model,
    },
    select: {
      verseId: true,
      contentHash: true,
    },
  });

  return new Map(existing.map((e) => [e.verseId, e.contentHash]));
}

// ============================================================================
// Main Script
// ============================================================================

interface RunStats {
  model: string;
  plannedCount: number;
  processedCount: number;
  skippedCount: number;
  writtenCount: number;
  errorsCount: number;
}

async function main(): Promise<void> {
  const args = parseArgs();
  const prisma = new PrismaClient();

  const stats: RunStats = {
    model: args.model,
    plannedCount: 0,
    processedCount: 0,
    skippedCount: 0,
    writtenCount: 0,
    errorsCount: 0,
  };

  try {
    console.log("=== Verse Embedding Generator ===\n");
    console.log(`Model: ${args.model}`);
    console.log(`Limit: ${args.limit}`);
    console.log(`Since ID: ${args.sinceId ?? "none"}`);
    console.log(`Dry run: ${args.dryRun}`);
    console.log("");

    // Fetch verses needing embeddings
    console.log("Fetching verses needing embeddings...");
    const verses = await fetchVersesNeedingEmbeddings(
      prisma,
      args.model,
      args.limit,
      args.sinceId
    );

    stats.plannedCount = verses.length;
    console.log(`Found ${verses.length} verses to process\n`);

    if (verses.length === 0) {
      printStats(stats);
      return;
    }

    // Process verses to get normalized text and content hashes
    const processed: Array<ProcessedVerse & { verse: VerseRecord }> = [];
    for (const verse of verses) {
      const result = processVerse(verse, args.model);
      if (result) {
        processed.push({ ...result, verse });
      }
    }

    // Get existing embeddings for double-check
    const existingHashes = await getExistingEmbeddings(
      prisma,
      processed.map((p) => p.verseId),
      args.model
    );

    // Filter out any that are already up to date (final check)
    const toEmbed = processed.filter((p) => {
      const existingHash = existingHashes.get(p.verseId);
      if (existingHash === p.contentHash) {
        stats.skippedCount++;
        return false;
      }
      return true;
    });

    if (toEmbed.length === 0) {
      console.log("All verses already have up-to-date embeddings.\n");
      stats.processedCount = processed.length;
      printStats(stats);
      return;
    }

    console.log(`${toEmbed.length} verses need embeddings (${stats.skippedCount} skipped)\n`);

    if (args.dryRun) {
      console.log("[DRY RUN] Would generate embeddings for:");
      for (const item of toEmbed.slice(0, 10)) {
        console.log(`  - Verse ${item.verseId}: "${item.normalizedText.slice(0, 50)}..."`);
      }
      if (toEmbed.length > 10) {
        console.log(`  ... and ${toEmbed.length - 10} more`);
      }
      console.log("");
      stats.processedCount = toEmbed.length;
      printStats(stats);
      return;
    }

    // Create embedding client
    const client = createEmbeddingClient(args.model);
    const dims = client.getDimensions();

    // Process in batches
    const batches = batch(toEmbed, EMBEDDING_BATCH_SIZE);

    for (let i = 0; i < batches.length; i++) {
      const batchItems = batches[i];
      console.log(
        `Processing batch ${i + 1}/${batches.length} (${batchItems.length} verses)...`
      );

      try {
        // Get embeddings from OpenAI
        const texts = batchItems.map((item) => item.normalizedText);
        const embeddings = await client.getEmbeddings(texts);

        // Write to database
        for (let j = 0; j < batchItems.length; j++) {
          const item = batchItems[j];
          const vector = embeddings[j];

          try {
            await prisma.verseEmbedding.upsert({
              where: { verseId: item.verseId },
              create: {
                verseId: item.verseId,
                model: args.model,
                dims: dims,
                vector: vector, // Stored as JSON array
                contentHash: item.contentHash,
              },
              update: {
                model: args.model,
                dims: dims,
                vector: vector,
                contentHash: item.contentHash,
              },
            });
            stats.writtenCount++;
          } catch (error) {
            console.error(`  Error writing embedding for verse ${item.verseId}:`, error);
            stats.errorsCount++;
          }
        }

        stats.processedCount += batchItems.length;
      } catch (error) {
        console.error(`  Error processing batch ${i + 1}:`, error);
        stats.errorsCount += batchItems.length;
      }
    }

    console.log("");
    printStats(stats);
  } finally {
    await prisma.$disconnect();
  }

  // Exit with appropriate code
  if (stats.errorsCount > 0) {
    process.exit(1);
  }
}

function printStats(stats: RunStats): void {
  console.log("=== Results ===");
  console.log(`Model:           ${stats.model}`);
  console.log(`Planned count:   ${stats.plannedCount}`);
  console.log(`Processed count: ${stats.processedCount}`);
  console.log(`Skipped count:   ${stats.skippedCount}`);
  console.log(`Written count:   ${stats.writtenCount}`);
  console.log(`Errors count:    ${stats.errorsCount}`);
}

// Run
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
