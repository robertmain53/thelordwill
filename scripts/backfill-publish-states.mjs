#!/usr/bin/env node
/**
 * Backfill Publish States Script
 *
 * Sets status/publishedAt fields for existing content records according to
 * deterministic rules based on content completeness.
 *
 * USAGE:
 *   node scripts/backfill-publish-states.mjs           # Dry-run (default)
 *   node scripts/backfill-publish-states.mjs --apply   # Apply changes
 *
 * RULES:
 * - If publishedAt already set → status="published"
 * - Else if "sufficient content" → status="published", publishedAt=updatedAt
 * - Else → status="draft", publishedAt=null
 *
 * SUFFICIENT CONTENT DEFINITIONS:
 * - PrayerPoint: description non-empty AND (content non-null OR verseMappings >= 1)
 * - Place: description non-empty AND (biblicalContext non-null OR verseMentions >= 1)
 * - Situation: metaDescription non-empty AND (content non-null OR verseMappings >= 1)
 * - Profession: description non-empty AND content non-null
 * - TravelItinerary: title non-empty AND dayPlans >= 1
 *
 * This script is IDEMPOTENT - running twice produces no further changes.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ANSI colors
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

const BATCH_SIZE = 200;

// Parse CLI args
const args = process.argv.slice(2);
const applyMode = args.includes("--apply");
const verbose = args.includes("--verbose") || args.includes("-v");

/**
 * Check if a string is non-empty (not null, not undefined, not empty after trim)
 */
function isNonEmpty(str) {
  return typeof str === "string" && str.trim().length > 0;
}

/**
 * Determine target state for a record
 * Returns: { status, publishedAt, reason }
 */
function determineState(record, hasSufficientContent) {
  // Rule 1: Already has publishedAt → should be published
  if (record.publishedAt != null) {
    return {
      status: "published",
      publishedAt: record.publishedAt,
      reason: "already has publishedAt",
    };
  }

  // Rule 2: Sufficient content → publish with updatedAt as publishedAt
  if (hasSufficientContent) {
    return {
      status: "published",
      publishedAt: record.updatedAt,
      reason: "sufficient content",
    };
  }

  // Rule 3: Insufficient content → draft
  return {
    status: "draft",
    publishedAt: null,
    reason: "insufficient content",
  };
}

/**
 * Check if record needs update
 */
function needsUpdate(record, targetState, hasPublishedAt = true) {
  if (record.status !== targetState.status) {
    return true;
  }
  // Only check publishedAt if the model has it
  if (hasPublishedAt) {
    const currentPublishedAt = record.publishedAt?.getTime?.() ?? null;
    const targetPublishedAt = targetState.publishedAt?.getTime?.() ?? null;
    if (currentPublishedAt !== targetPublishedAt) {
      return true;
    }
  }
  return false;
}

// ============================================================================
// Model-specific processors
// ============================================================================

async function processPrayerPoints() {
  const modelName = "PrayerPoint";
  const records = await prisma.prayerPoint.findMany({
    select: {
      id: true,
      slug: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      description: true,
      content: true,
      _count: {
        select: { verseMappings: true },
      },
    },
  });

  const stats = { total: records.length, willPublish: 0, willDraft: 0, alreadyCorrect: 0, updates: [] };

  for (const record of records) {
    // Sufficient: description non-empty AND (content non-null OR verseMappings >= 1)
    const hasSufficientContent =
      isNonEmpty(record.description) &&
      (record.content != null || record._count.verseMappings >= 1);

    const targetState = determineState(record, hasSufficientContent);

    if (needsUpdate(record, targetState)) {
      stats.updates.push({ id: record.id, slug: record.slug, ...targetState });
      if (targetState.status === "published") {
        stats.willPublish++;
      } else {
        stats.willDraft++;
      }
    } else {
      stats.alreadyCorrect++;
    }
  }

  return { modelName, stats, hasPublishedAt: true };
}

async function processPlaces() {
  const modelName = "Place";
  const records = await prisma.place.findMany({
    select: {
      id: true,
      slug: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      description: true,
      biblicalContext: true,
      _count: {
        select: { verseMentions: true },
      },
    },
  });

  const stats = { total: records.length, willPublish: 0, willDraft: 0, alreadyCorrect: 0, updates: [] };

  for (const record of records) {
    // Sufficient: description non-empty AND (biblicalContext non-null OR verseMentions >= 1)
    const hasSufficientContent =
      isNonEmpty(record.description) &&
      (record.biblicalContext != null || record._count.verseMentions >= 1);

    const targetState = determineState(record, hasSufficientContent);

    if (needsUpdate(record, targetState)) {
      stats.updates.push({ id: record.id, slug: record.slug, ...targetState });
      if (targetState.status === "published") {
        stats.willPublish++;
      } else {
        stats.willDraft++;
      }
    } else {
      stats.alreadyCorrect++;
    }
  }

  return { modelName, stats, hasPublishedAt: true };
}

async function processSituations() {
  const modelName = "Situation";
  const records = await prisma.situation.findMany({
    select: {
      id: true,
      slug: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      metaDescription: true,
      content: true,
      _count: {
        select: { verseMappings: true },
      },
    },
  });

  const stats = { total: records.length, willPublish: 0, willDraft: 0, alreadyCorrect: 0, updates: [] };

  for (const record of records) {
    // Sufficient: metaDescription non-empty AND (content non-null OR verseMappings >= 1)
    const hasSufficientContent =
      isNonEmpty(record.metaDescription) &&
      (record.content != null || record._count.verseMappings >= 1);

    const targetState = determineState(record, hasSufficientContent);

    if (needsUpdate(record, targetState)) {
      stats.updates.push({ id: record.id, slug: record.slug, ...targetState });
      if (targetState.status === "published") {
        stats.willPublish++;
      } else {
        stats.willDraft++;
      }
    } else {
      stats.alreadyCorrect++;
    }
  }

  return { modelName, stats, hasPublishedAt: true };
}

async function processProfessions() {
  const modelName = "Profession";
  const records = await prisma.profession.findMany({
    select: {
      id: true,
      slug: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      description: true,
      content: true,
    },
  });

  const stats = { total: records.length, willPublish: 0, willDraft: 0, alreadyCorrect: 0, updates: [] };

  for (const record of records) {
    // Sufficient: description non-empty AND content non-null
    // (No verseMappings relation on Profession)
    const hasSufficientContent =
      isNonEmpty(record.description) && record.content != null;

    const targetState = determineState(record, hasSufficientContent);

    if (needsUpdate(record, targetState)) {
      stats.updates.push({ id: record.id, slug: record.slug, ...targetState });
      if (targetState.status === "published") {
        stats.willPublish++;
      } else {
        stats.willDraft++;
      }
    } else {
      stats.alreadyCorrect++;
    }
  }

  return { modelName, stats, hasPublishedAt: true };
}

async function processTravelItineraries() {
  const modelName = "TravelItinerary";
  const records = await prisma.travelItinerary.findMany({
    select: {
      id: true,
      slug: true,
      status: true,
      updatedAt: true,
      title: true,
      _count: {
        select: { dayPlans: true },
      },
    },
  });

  const stats = { total: records.length, willPublish: 0, willDraft: 0, alreadyCorrect: 0, updates: [] };

  for (const record of records) {
    // Sufficient: title non-empty AND dayPlans >= 1
    // Note: TravelItinerary has no publishedAt field, only status
    const hasSufficientContent =
      isNonEmpty(record.title) && record._count.dayPlans >= 1;

    // Simplified state for model without publishedAt
    const targetStatus = hasSufficientContent ? "published" : "draft";
    const reason = hasSufficientContent ? "sufficient content" : "insufficient content";

    if (record.status !== targetStatus) {
      stats.updates.push({ id: record.id, slug: record.slug, status: targetStatus, reason });
      if (targetStatus === "published") {
        stats.willPublish++;
      } else {
        stats.willDraft++;
      }
    } else {
      stats.alreadyCorrect++;
    }
  }

  return { modelName, stats, hasPublishedAt: false };
}

// ============================================================================
// Update functions
// ============================================================================

async function applyUpdates(modelName, updates, hasPublishedAt) {
  if (updates.length === 0) return 0;

  let updated = 0;

  // Process in batches
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);

    // Use transaction for batch
    await prisma.$transaction(
      batch.map((update) => {
        const data = { status: update.status };
        if (hasPublishedAt) {
          data.publishedAt = update.publishedAt;
        }

        switch (modelName) {
          case "PrayerPoint":
            return prisma.prayerPoint.update({ where: { id: update.id }, data });
          case "Place":
            return prisma.place.update({ where: { id: update.id }, data });
          case "Situation":
            return prisma.situation.update({ where: { id: update.id }, data });
          case "Profession":
            return prisma.profession.update({ where: { id: update.id }, data });
          case "TravelItinerary":
            return prisma.travelItinerary.update({ where: { id: update.id }, data });
          default:
            throw new Error(`Unknown model: ${modelName}`);
        }
      })
    );

    updated += batch.length;
    process.stdout.write(`\r  Updated ${updated}/${updates.length} ${modelName} records...`);
  }

  console.log(); // Newline after progress
  return updated;
}

// ============================================================================
// Reporting
// ============================================================================

function printSummaryTable(results) {
  console.log("\n" + "=".repeat(80));
  console.log(`${BOLD}BACKFILL SUMMARY${RESET}`);
  console.log("=".repeat(80));

  // Table header
  console.log(
    `\n${"Model".padEnd(20)} ${"Total".padStart(8)} ${"Publish".padStart(10)} ${"Draft".padStart(10)} ${"Unchanged".padStart(12)}`
  );
  console.log("-".repeat(62));

  let totals = { total: 0, willPublish: 0, willDraft: 0, alreadyCorrect: 0 };

  for (const { modelName, stats } of results) {
    const row = `${modelName.padEnd(20)} ${String(stats.total).padStart(8)} ${
      stats.willPublish > 0
        ? `${GREEN}${String(stats.willPublish).padStart(10)}${RESET}`
        : String(stats.willPublish).padStart(10)
    } ${
      stats.willDraft > 0
        ? `${YELLOW}${String(stats.willDraft).padStart(10)}${RESET}`
        : String(stats.willDraft).padStart(10)
    } ${String(stats.alreadyCorrect).padStart(12)}`;
    console.log(row);

    totals.total += stats.total;
    totals.willPublish += stats.willPublish;
    totals.willDraft += stats.willDraft;
    totals.alreadyCorrect += stats.alreadyCorrect;
  }

  console.log("-".repeat(62));
  console.log(
    `${"TOTAL".padEnd(20)} ${String(totals.total).padStart(8)} ${
      totals.willPublish > 0
        ? `${GREEN}${String(totals.willPublish).padStart(10)}${RESET}`
        : String(totals.willPublish).padStart(10)
    } ${
      totals.willDraft > 0
        ? `${YELLOW}${String(totals.willDraft).padStart(10)}${RESET}`
        : String(totals.willDraft).padStart(10)
    } ${String(totals.alreadyCorrect).padStart(12)}`
  );

  console.log("\n" + "=".repeat(80) + "\n");

  return totals;
}

function printVerboseDetails(results) {
  for (const { modelName, stats } of results) {
    if (stats.updates.length === 0) continue;

    console.log(`\n${BOLD}${modelName} updates:${RESET}`);
    for (const update of stats.updates.slice(0, 10)) {
      const statusColor = update.status === "published" ? GREEN : YELLOW;
      console.log(
        `  ${DIM}${update.slug}${RESET} → ${statusColor}${update.status}${RESET} (${update.reason})`
      );
    }
    if (stats.updates.length > 10) {
      console.log(`  ${DIM}... and ${stats.updates.length - 10} more${RESET}`);
    }
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log(`\n${CYAN}${BOLD}Publish State Backfill Script${RESET}`);
  console.log(`Mode: ${applyMode ? `${RED}${BOLD}APPLY${RESET}` : `${GREEN}DRY-RUN${RESET}`}\n`);

  if (!applyMode) {
    console.log(`${YELLOW}This is a dry-run. No changes will be made.${RESET}`);
    console.log(`${YELLOW}Use --apply to actually update the database.${RESET}\n`);
  }

  // Process all models
  console.log("Analyzing records...\n");

  const results = [];

  process.stdout.write("  Processing PrayerPoints...");
  results.push(await processPrayerPoints());
  console.log(" done");

  process.stdout.write("  Processing Places...");
  results.push(await processPlaces());
  console.log(" done");

  process.stdout.write("  Processing Situations...");
  results.push(await processSituations());
  console.log(" done");

  process.stdout.write("  Processing Professions...");
  results.push(await processProfessions());
  console.log(" done");

  process.stdout.write("  Processing TravelItineraries...");
  results.push(await processTravelItineraries());
  console.log(" done");

  // Print summary
  const totals = printSummaryTable(results);

  // Print verbose details if requested
  if (verbose) {
    printVerboseDetails(results);
  }

  // Apply if requested
  if (applyMode) {
    const totalUpdates = totals.willPublish + totals.willDraft;

    if (totalUpdates === 0) {
      console.log(`${GREEN}No updates needed. Database is already in correct state.${RESET}\n`);
    } else {
      console.log(`${YELLOW}Applying ${totalUpdates} updates...${RESET}\n`);

      for (const { modelName, stats, hasPublishedAt } of results) {
        if (stats.updates.length > 0) {
          await applyUpdates(modelName, stats.updates, hasPublishedAt);
        }
      }

      console.log(`\n${GREEN}${BOLD}Backfill complete!${RESET}`);
      console.log(`Updated ${totalUpdates} records across ${results.length} models.\n`);
    }
  } else {
    const totalUpdates = totals.willPublish + totals.willDraft;
    if (totalUpdates > 0) {
      console.log(`${CYAN}To apply these changes, run:${RESET}`);
      console.log(`  node scripts/backfill-publish-states.mjs --apply\n`);
    }
  }
}

main()
  .catch((err) => {
    console.error(`${RED}Error:${RESET}`, err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
