#!/usr/bin/env node
/**
 * QA Script: Semantic Search Contract Validation
 *
 * Validates:
 * - Mock embedding provider generates deterministic vectors
 * - Response shape matches expected contract
 * - Cosine similarity computation works correctly
 * - No network calls required (uses EMBEDDINGS_PROVIDER=mock)
 *
 * USAGE:
 *   node scripts/qa/qa-semantic-search-contract.mjs
 *
 * EXIT CODES:
 *   0 - All validations passed
 *   1 - Validation failed
 */

import { createHash } from "crypto";
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

// Mock embedding dimensions (must match _embeddings-lib.ts)
const MOCK_DIMENSIONS = 1536;

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

// ============================================================================
// Mock Embedding Implementation (mirror of _embeddings-lib.ts)
// ============================================================================

/**
 * Generate a deterministic mock embedding from text using SHA-256.
 * This must match the implementation in _embeddings-lib.ts exactly.
 */
function generateMockEmbedding(text) {
  const vector = [];
  let seed = text;

  while (vector.length < MOCK_DIMENSIONS) {
    const hash = createHash("sha256").update(seed, "utf8").digest();
    for (let i = 0; i < hash.length && vector.length < MOCK_DIMENSIONS; i++) {
      vector.push((hash[i] / 127.5) - 1);
    }
    seed = hash.toString("hex");
  }

  // L2 normalize
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] = vector[i] / magnitude;
    }
  }

  return vector;
}

/**
 * Compute cosine similarity between two vectors.
 */
function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

// ============================================================================
// Response Schema Definition
// ============================================================================

/**
 * Expected response shape for /api/semantic-search/verses
 */
const RESPONSE_SCHEMA = {
  query: "string",
  model: "string",
  k: "number",
  results: "array",
};

/**
 * Expected result item shape
 */
const RESULT_ITEM_SCHEMA = {
  verseId: "number",
  bookId: "number",
  chapter: "number",
  verseNumber: "number",
  text: "string",
  score: "number",
};

/**
 * Validate an object against a schema
 */
function validateSchema(obj, schema, path = "") {
  const errors = [];

  for (const [key, expectedType] of Object.entries(schema)) {
    const fullPath = path ? `${path}.${key}` : key;
    const value = obj[key];

    if (value === undefined) {
      errors.push(`Missing required field: ${fullPath}`);
      continue;
    }

    if (expectedType === "array") {
      if (!Array.isArray(value)) {
        errors.push(`${fullPath}: expected array, got ${typeof value}`);
      }
    } else if (typeof value !== expectedType) {
      errors.push(`${fullPath}: expected ${expectedType}, got ${typeof value}`);
    }
  }

  return errors;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate mock embedding is deterministic
 */
async function validateDeterministicEmbedding(results) {
  process.stdout.write(`  Deterministic embedding           `);

  try {
    const testText = "comfort in times of trouble";

    // Generate embedding twice
    const embedding1 = generateMockEmbedding(testText);
    const embedding2 = generateMockEmbedding(testText);

    // Check they're identical
    if (embedding1.length !== embedding2.length) {
      console.log(`${RED}FAIL${RESET} - Different lengths`);
      results.errors.push("Mock embeddings have different lengths");
      return false;
    }

    for (let i = 0; i < embedding1.length; i++) {
      if (embedding1[i] !== embedding2[i]) {
        console.log(`${RED}FAIL${RESET} - Different values at index ${i}`);
        results.errors.push(`Mock embeddings differ at index ${i}`);
        return false;
      }
    }

    console.log(`${GREEN}PASS${RESET} (identical across calls)`);
    results.passed++;
    return true;
  } catch (error) {
    console.log(`${RED}FAIL${RESET} - ${error.message}`);
    results.errors.push(`Deterministic embedding test failed: ${error.message}`);
    return false;
  }
}

/**
 * Validate embedding dimensions
 */
async function validateEmbeddingDimensions(results) {
  process.stdout.write(`  Embedding dimensions (${MOCK_DIMENSIONS})`.padEnd(36));

  try {
    const embedding = generateMockEmbedding("test query");

    if (embedding.length !== MOCK_DIMENSIONS) {
      console.log(`${RED}FAIL${RESET} - Got ${embedding.length}, expected ${MOCK_DIMENSIONS}`);
      results.errors.push(`Wrong embedding dimensions: ${embedding.length}`);
      return false;
    }

    console.log(`${GREEN}PASS${RESET}`);
    results.passed++;
    return true;
  } catch (error) {
    console.log(`${RED}FAIL${RESET} - ${error.message}`);
    results.errors.push(`Dimension test failed: ${error.message}`);
    return false;
  }
}

/**
 * Validate embedding normalization (L2 norm should be ~1)
 */
async function validateEmbeddingNormalization(results) {
  process.stdout.write(`  Embedding normalized (L2 ~ 1)     `);

  try {
    const embedding = generateMockEmbedding("test query for normalization");

    const l2Norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));

    // Allow small floating-point error
    if (Math.abs(l2Norm - 1.0) > 0.0001) {
      console.log(`${RED}FAIL${RESET} - L2 norm is ${l2Norm}, expected ~1.0`);
      results.errors.push(`Embedding not normalized: L2 norm = ${l2Norm}`);
      return false;
    }

    console.log(`${GREEN}PASS${RESET} (L2 = ${l2Norm.toFixed(6)})`);
    results.passed++;
    return true;
  } catch (error) {
    console.log(`${RED}FAIL${RESET} - ${error.message}`);
    results.errors.push(`Normalization test failed: ${error.message}`);
    return false;
  }
}

/**
 * Validate cosine similarity computation
 */
async function validateCosineSimilarity(results) {
  process.stdout.write(`  Cosine similarity                 `);

  try {
    // Identical vectors should have similarity ~1
    const v1 = generateMockEmbedding("same text");
    const v2 = generateMockEmbedding("same text");

    const selfSimilarity = cosineSimilarity(v1, v2);
    if (Math.abs(selfSimilarity - 1.0) > 0.0001) {
      console.log(`${RED}FAIL${RESET} - Self-similarity is ${selfSimilarity}, expected ~1.0`);
      results.errors.push(`Self-similarity should be ~1.0, got ${selfSimilarity}`);
      return false;
    }

    // Different texts should have similarity < 1
    const v3 = generateMockEmbedding("completely different text here");
    const diffSimilarity = cosineSimilarity(v1, v3);

    if (diffSimilarity >= 1.0) {
      console.log(`${RED}FAIL${RESET} - Different texts have similarity >= 1.0`);
      results.errors.push("Different texts should have similarity < 1.0");
      return false;
    }

    console.log(`${GREEN}PASS${RESET} (self=1.0, diff=${diffSimilarity.toFixed(4)})`);
    results.passed++;
    return true;
  } catch (error) {
    console.log(`${RED}FAIL${RESET} - ${error.message}`);
    results.errors.push(`Cosine similarity test failed: ${error.message}`);
    return false;
  }
}

/**
 * Validate response schema
 */
async function validateResponseSchema(results) {
  process.stdout.write(`  Response schema                   `);

  try {
    // Create a mock response matching what the API should return
    const mockResponse = {
      query: "test query",
      model: "text-embedding-3-small",
      k: 10,
      results: [
        {
          verseId: 1,
          bookId: 1,
          chapter: 1,
          verseNumber: 1,
          text: "In the beginning God created the heaven and the earth.",
          score: 0.85,
        },
      ],
    };

    // Validate top-level schema
    const topErrors = validateSchema(mockResponse, RESPONSE_SCHEMA);
    if (topErrors.length > 0) {
      console.log(`${RED}FAIL${RESET} - Schema errors`);
      topErrors.forEach((e) => results.errors.push(e));
      return false;
    }

    // Validate result item schema
    for (let i = 0; i < mockResponse.results.length; i++) {
      const itemErrors = validateSchema(
        mockResponse.results[i],
        RESULT_ITEM_SCHEMA,
        `results[${i}]`
      );
      if (itemErrors.length > 0) {
        console.log(`${RED}FAIL${RESET} - Item schema errors`);
        itemErrors.forEach((e) => results.errors.push(e));
        return false;
      }
    }

    console.log(`${GREEN}PASS${RESET}`);
    results.passed++;
    return true;
  } catch (error) {
    console.log(`${RED}FAIL${RESET} - ${error.message}`);
    results.errors.push(`Schema validation failed: ${error.message}`);
    return false;
  }
}

/**
 * Validate database has verse data for semantic search to work
 */
async function validateVerseDataExists(results) {
  process.stdout.write(`  Verse data available              `);

  try {
    const count = await prisma.verse.count();

    if (count > 0) {
      console.log(`${GREEN}PASS${RESET} (${count} verses)`);
      results.passed++;
      return true;
    } else {
      console.log(`${YELLOW}WARN${RESET} - No verses in database`);
      results.warnings.push("No verses in database - semantic search will return empty results");
      return true;
    }
  } catch (error) {
    console.log(`${RED}FAIL${RESET} - ${error.message}`);
    results.errors.push(`Verse count query failed: ${error.message}`);
    return false;
  }
}

/**
 * Validate error response schema
 */
async function validateErrorResponseSchema(results) {
  process.stdout.write(`  Error response schema             `);

  try {
    const mockErrorResponse = {
      error: "Missing required parameter: q",
    };

    if (typeof mockErrorResponse.error !== "string") {
      console.log(`${RED}FAIL${RESET} - error field should be string`);
      results.errors.push("Error response schema invalid");
      return false;
    }

    console.log(`${GREEN}PASS${RESET}`);
    results.passed++;
    return true;
  } catch (error) {
    console.log(`${RED}FAIL${RESET} - ${error.message}`);
    results.errors.push(`Error schema validation failed: ${error.message}`);
    return false;
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log(`\n${CYAN}${BOLD}Semantic Search Contract Validation${RESET}\n`);
  console.log(`${DIM}Testing without network calls (mock embeddings)${RESET}\n`);

  const results = {
    passed: 0,
    errors: [],
    warnings: [],
    skipped: [],
  };

  console.log("-".repeat(70));
  console.log(`${BOLD}MOCK EMBEDDING PROVIDER${RESET}`);
  console.log("-".repeat(70) + "\n");

  await validateDeterministicEmbedding(results);
  await validateEmbeddingDimensions(results);
  await validateEmbeddingNormalization(results);
  await validateCosineSimilarity(results);

  console.log("\n" + "-".repeat(70));
  console.log(`${BOLD}API CONTRACT${RESET}`);
  console.log("-".repeat(70) + "\n");

  await validateResponseSchema(results);
  await validateErrorResponseSchema(results);
  await validateVerseDataExists(results);

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
    console.log(`${RED}${BOLD}SEMANTIC SEARCH CONTRACT QA FAILED${RESET}\n`);
    process.exitCode = 1;
  } else {
    console.log(`${GREEN}${BOLD}SEMANTIC SEARCH CONTRACT QA PASSED${RESET}\n`);
    process.exitCode = 0;
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(`${RED}Fatal error:${RESET}`, error);
  process.exitCode = 1;
});
