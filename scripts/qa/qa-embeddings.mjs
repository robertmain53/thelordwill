#!/usr/bin/env node
/**
 * QA Script: Verse Embeddings Validation
 *
 * Validates:
 * - VerseEmbedding table exists in database
 * - At least N embeddings exist (configurable via MIN_EMBEDDINGS, default 50)
 * - Vector arrays are non-empty and dims matches vector length for a sample
 *
 * USAGE:
 *   node scripts/qa/qa-embeddings.mjs
 *   MIN_EMBEDDINGS=100 node scripts/qa/qa-embeddings.mjs
 *
 * EXIT CODES:
 *   0 - All validations passed
 *   1 - Validation failed
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

// Configuration
const MIN_EMBEDDINGS = parseInt(process.env.MIN_EMBEDDINGS ?? "50", 10);
const SAMPLE_SIZE = 10;

function log(color, prefix, message) {
  console.log(`${color}${BOLD}[${prefix}]${RESET} ${message}`);
}

function logError(message) {
  log(RED, "FAIL", message);
}

function logInfo(message) {
  log(CYAN, "INFO", message);
}

function logSuccess(message) {
  log(GREEN, "PASS", message);
}

function logWarn(message) {
  log(YELLOW, "WARN", message);
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Check that VerseEmbedding table exists by querying it
 */
async function validateTableExists(results) {
  process.stdout.write(`  Table exists                      `);

  try {
    // If the table doesn't exist, this will throw
    await prisma.verseEmbedding.count();
    console.log(`${GREEN}PASS${RESET}`);
    results.passed++;
    return true;
  } catch (error) {
    if (error.code === "P2021" || error.message.includes("does not exist")) {
      console.log(`${RED}FAIL${RESET} - VerseEmbedding table does not exist`);
      results.errors.push("VerseEmbedding table does not exist in database");
    } else {
      console.log(`${RED}FAIL${RESET} - Database error: ${error.message}`);
      results.errors.push(`Database error: ${error.message}`);
    }
    return false;
  }
}

/**
 * Check that at least MIN_EMBEDDINGS embeddings exist
 */
async function validateMinimumCount(results) {
  process.stdout.write(`  Minimum count (>= ${MIN_EMBEDDINGS})`.padEnd(36));

  try {
    const count = await prisma.verseEmbedding.count();

    if (count >= MIN_EMBEDDINGS) {
      console.log(`${GREEN}PASS${RESET} (${count} embeddings)`);
      results.passed++;
      return true;
    } else {
      console.log(`${RED}FAIL${RESET} - Only ${count} embeddings (need >= ${MIN_EMBEDDINGS})`);
      results.errors.push(`Insufficient embeddings: ${count} < ${MIN_EMBEDDINGS}`);
      return false;
    }
  } catch (error) {
    console.log(`${RED}FAIL${RESET} - ${error.message}`);
    results.errors.push(`Count query failed: ${error.message}`);
    return false;
  }
}

/**
 * Validate a sample of embeddings for vector integrity
 */
async function validateVectorIntegrity(results) {
  process.stdout.write(`  Vector integrity (sample)         `);

  try {
    const samples = await prisma.verseEmbedding.findMany({
      take: SAMPLE_SIZE,
      select: {
        id: true,
        verseId: true,
        dims: true,
        vector: true,
        model: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (samples.length === 0) {
      console.log(`${YELLOW}SKIP${RESET} - No embeddings to sample`);
      results.skipped.push("Vector integrity: No embeddings to sample");
      return true;
    }

    const issues = [];

    for (const sample of samples) {
      // Check vector is an array
      if (!Array.isArray(sample.vector)) {
        issues.push(`Verse ${sample.verseId}: vector is not an array`);
        continue;
      }

      // Check vector is non-empty
      if (sample.vector.length === 0) {
        issues.push(`Verse ${sample.verseId}: vector is empty`);
        continue;
      }

      // Check dims matches vector length
      if (sample.dims !== sample.vector.length) {
        issues.push(
          `Verse ${sample.verseId}: dims (${sample.dims}) != vector length (${sample.vector.length})`
        );
        continue;
      }

      // Check all elements are numbers
      const nonNumbers = sample.vector.filter((v) => typeof v !== "number");
      if (nonNumbers.length > 0) {
        issues.push(`Verse ${sample.verseId}: vector contains non-number elements`);
        continue;
      }

      // Check for NaN or Infinity
      const invalidValues = sample.vector.filter((v) => !Number.isFinite(v));
      if (invalidValues.length > 0) {
        issues.push(`Verse ${sample.verseId}: vector contains NaN or Infinity`);
        continue;
      }
    }

    if (issues.length === 0) {
      console.log(`${GREEN}PASS${RESET} (${samples.length} samples validated)`);
      results.passed++;
      return true;
    } else {
      console.log(`${RED}FAIL${RESET} - ${issues.length} issues found`);
      issues.forEach((issue) => results.errors.push(issue));
      return false;
    }
  } catch (error) {
    console.log(`${RED}FAIL${RESET} - ${error.message}`);
    results.errors.push(`Vector integrity check failed: ${error.message}`);
    return false;
  }
}

/**
 * Validate model consistency
 */
async function validateModelConsistency(results) {
  process.stdout.write(`  Model consistency                 `);

  try {
    // Get distinct models used
    const models = await prisma.verseEmbedding.groupBy({
      by: ["model"],
      _count: { model: true },
    });

    if (models.length === 0) {
      console.log(`${YELLOW}SKIP${RESET} - No embeddings found`);
      results.skipped.push("Model consistency: No embeddings found");
      return true;
    }

    const modelSummary = models
      .map((m) => `${m.model} (${m._count.model})`)
      .join(", ");

    if (models.length === 1) {
      console.log(`${GREEN}PASS${RESET} (${modelSummary})`);
      results.passed++;
    } else {
      // Multiple models is a warning, not an error
      console.log(`${YELLOW}WARN${RESET} - Multiple models: ${modelSummary}`);
      results.warnings.push(`Multiple embedding models in use: ${modelSummary}`);
    }

    return true;
  } catch (error) {
    console.log(`${RED}FAIL${RESET} - ${error.message}`);
    results.errors.push(`Model consistency check failed: ${error.message}`);
    return false;
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log(`\n${CYAN}${BOLD}Verse Embeddings QA Validation${RESET}\n`);
  console.log(`${DIM}MIN_EMBEDDINGS=${MIN_EMBEDDINGS}${RESET}\n`);

  const results = {
    passed: 0,
    errors: [],
    warnings: [],
    skipped: [],
  };

  console.log("-".repeat(70));
  console.log(`${BOLD}VERSE EMBEDDINGS CHECKS${RESET}`);
  console.log("-".repeat(70) + "\n");

  try {
    // Run validations in order (stop early if table doesn't exist)
    const tableExists = await validateTableExists(results);

    if (tableExists) {
      await validateMinimumCount(results);
      await validateVectorIntegrity(results);
      await validateModelConsistency(results);
    }

    // Summary
    console.log("\n" + "=".repeat(70));
    console.log(`${BOLD}SUMMARY${RESET}`);
    console.log("=".repeat(70));

    console.log(`
  Passed:   ${results.passed > 0 ? GREEN : ""}${results.passed}${RESET}
  Errors:   ${results.errors.length > 0 ? RED : GREEN}${results.errors.length}${RESET}
  Warnings: ${results.warnings.length > 0 ? YELLOW : GREEN}${results.warnings.length}${RESET}
  Skipped:  ${results.skipped.length > 0 ? YELLOW : ""}${results.skipped.length}${RESET}
`);

    if (results.errors.length > 0) {
      console.log(`${RED}Errors:${RESET}`);
      results.errors.forEach((e) => console.log(`  - ${e}`));
      console.log();
    }

    if (results.warnings.length > 0) {
      console.log(`${YELLOW}Warnings:${RESET}`);
      results.warnings.forEach((w) => console.log(`  - ${w}`));
      console.log();
    }

    if (results.skipped.length > 0) {
      console.log(`${DIM}Skipped:${RESET}`);
      results.skipped.forEach((s) => console.log(`  ${DIM}- ${s}${RESET}`));
      console.log();
    }

    if (results.errors.length > 0) {
      console.log(`${RED}${BOLD}EMBEDDINGS QA FAILED${RESET}\n`);
      process.exitCode = 1;
    } else {
      console.log(`${GREEN}${BOLD}EMBEDDINGS QA PASSED${RESET}\n`);
      process.exitCode = 0;
    }
  } catch (error) {
    logError(`Unexpected error: ${error.message}`);
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
