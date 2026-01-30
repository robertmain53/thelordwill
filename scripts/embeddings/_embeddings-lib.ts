/**
 * _embeddings-lib.ts
 *
 * Shared helpers for verse embedding generation:
 * - Text normalization
 * - SHA-256 hashing
 * - Batching utilities
 * - OpenAI embedding client wrapper
 */

import { createHash } from "crypto";

// ============================================================================
// Text Normalization
// ============================================================================

/**
 * Translation fields in priority order for verse text selection.
 */
export const TRANSLATION_PRIORITY = [
  "textKjv",
  "textWeb",
  "textAsv",
  "textRV",
  "textBL",
] as const;

export type TranslationField = (typeof TRANSLATION_PRIORITY)[number];

/**
 * Verse record type with translation fields.
 */
export interface VerseRecord {
  id: number;
  textKjv: string | null;
  textWeb: string | null;
  textAsv: string | null;
  textRV: string | null;
  textBL: string | null;
}

/**
 * Get the first non-null translation text from a verse in priority order.
 * Returns null if no translation is available.
 */
export function getVerseText(verse: VerseRecord): string | null {
  for (const field of TRANSLATION_PRIORITY) {
    const text = verse[field];
    if (text !== null && text !== undefined && text.trim() !== "") {
      return text;
    }
  }
  return null;
}

/**
 * Normalize verse text deterministically:
 * 1. Trim leading/trailing whitespace
 * 2. Convert CRLF to LF
 * 3. Collapse internal whitespace to single spaces
 */
export function normalizeText(text: string): string {
  return text
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n+/g, " ")
    .trim();
}

// ============================================================================
// Hashing
// ============================================================================

/**
 * Compute SHA-256 content hash for idempotency check.
 * Format: sha256(`${model}\n${normalizedText}`)
 */
export function computeContentHash(model: string, normalizedText: string): string {
  const input = `${model}\n${normalizedText}`;
  return createHash("sha256").update(input, "utf8").digest("hex");
}

// ============================================================================
// Batching
// ============================================================================

/**
 * Split an array into batches of specified size.
 */
export function batch<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}

// ============================================================================
// OpenAI Embedding Client
// ============================================================================

export interface EmbeddingResult {
  embedding: number[];
  index: number;
}

export interface EmbeddingResponse {
  data: EmbeddingResult[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface EmbeddingError {
  error: {
    message: string;
    type: string;
    code: string | null;
  };
}

/**
 * Configuration for the embedding client.
 */
export interface EmbeddingClientConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
  maxRetries?: number;
  retryDelayMs?: number;
}

/**
 * Safe OpenAI embedding client wrapper using native fetch.
 * Supports batched embedding requests with retry logic.
 */
export class EmbeddingClient {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private maxRetries: number;
  private retryDelayMs: number;

  constructor(config: EmbeddingClientConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.baseUrl = config.baseUrl ?? "https://api.openai.com/v1";
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelayMs = config.retryDelayMs ?? 1000;
  }

  /**
   * Get embeddings for a batch of texts.
   * Returns embeddings in the same order as input texts.
   */
  async getEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/embeddings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            input: texts,
          }),
        });

        if (!response.ok) {
          const errorBody = (await response.json().catch(() => ({}))) as EmbeddingError;
          const errorMessage = errorBody.error?.message ?? response.statusText;

          // Don't retry on 4xx errors (except 429 rate limit)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw new Error(`OpenAI API error (${response.status}): ${errorMessage}`);
          }

          throw new Error(`OpenAI API error (${response.status}): ${errorMessage}`);
        }

        const data = (await response.json()) as EmbeddingResponse;

        // Sort by index to ensure order matches input
        const sorted = data.data.sort((a, b) => a.index - b.index);
        return sorted.map((item) => item.embedding);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.maxRetries - 1) {
          // Exponential backoff
          const delay = this.retryDelayMs * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    throw lastError ?? new Error("Failed to get embeddings after retries");
  }

  /**
   * Get the dimensionality of embeddings for the current model.
   * This is model-specific.
   */
  getDimensions(): number {
    // Known dimensions for OpenAI embedding models
    const modelDims: Record<string, number> = {
      "text-embedding-3-small": 1536,
      "text-embedding-3-large": 3072,
      "text-embedding-ada-002": 1536,
    };

    return modelDims[this.model] ?? 1536;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Mock Embedding Client (for CI/testing - no network calls)
// ============================================================================

const MOCK_DIMENSIONS = 1536;

/**
 * Generate a deterministic mock embedding from text using SHA-256.
 * Produces a normalized vector of MOCK_DIMENSIONS length.
 */
export function generateMockEmbedding(text: string): number[] {
  // Create multiple hashes to fill the vector
  const vector: number[] = [];
  let seed = text;

  while (vector.length < MOCK_DIMENSIONS) {
    const hash = createHash("sha256").update(seed, "utf8").digest();
    // Convert each byte to a float in [-1, 1]
    for (let i = 0; i < hash.length && vector.length < MOCK_DIMENSIONS; i++) {
      vector.push((hash[i] / 127.5) - 1);
    }
    seed = hash.toString("hex"); // Chain for more bytes
  }

  // Normalize the vector (L2 normalization)
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] = vector[i] / magnitude;
    }
  }

  return vector;
}

/**
 * Mock embedding client for testing without network calls.
 * Generates deterministic embeddings from SHA-256 hashes.
 */
export class MockEmbeddingClient {
  private model: string;

  constructor(model: string) {
    this.model = model;
  }

  async getEmbeddings(texts: string[]): Promise<number[][]> {
    return texts.map((text) => generateMockEmbedding(text));
  }

  getDimensions(): number {
    return MOCK_DIMENSIONS;
  }
}

/**
 * Interface for embedding clients (both real and mock).
 */
export interface IEmbeddingClient {
  getEmbeddings(texts: string[]): Promise<number[][]>;
  getDimensions(): number;
}

/**
 * Create an embedding client from environment variables.
 *
 * If EMBEDDINGS_PROVIDER=mock, returns a MockEmbeddingClient (no network calls).
 * Otherwise, requires OPENAI_API_KEY and returns a real EmbeddingClient.
 */
export function createEmbeddingClient(model: string): IEmbeddingClient {
  const provider = (process.env.EMBEDDINGS_PROVIDER ?? "mock").toLowerCase();

  if (provider === "mock") {
    return new MockEmbeddingClient(model);
  }

  if (provider !== "openai") {
    console.warn(
      `Unknown embeddings provider "${provider}" (falling back to mock for deterministic responses).`
    );
    return new MockEmbeddingClient(model);
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn(
      "OPENAI_API_KEY is not set — falling back to mock embeddings to avoid runtime failures."
    );
    return new MockEmbeddingClient(model);
  }

  return new EmbeddingClient({
    apiKey,
    model,
  });
}

// ============================================================================
// Verse Processing Types
// ============================================================================

export interface ProcessedVerse {
  verseId: number;
  normalizedText: string;
  contentHash: string;
}

export interface EmbeddingWriteData {
  verseId: number;
  model: string;
  dims: number;
  vector: number[];
  contentHash: string;
}

/**
 * Process a verse record into embedding-ready data.
 * Returns null if verse has no usable text.
 */
export function processVerse(verse: VerseRecord, model: string): ProcessedVerse | null {
  const text = getVerseText(verse);
  if (!text) {
    return null;
  }

  const normalizedText = normalizeText(text);
  if (!normalizedText) {
    return null;
  }

  const contentHash = computeContentHash(model, normalizedText);

  return {
    verseId: verse.id,
    normalizedText,
    contentHash,
  };
}

// ============================================================================
// Vector Similarity (for semantic search)
// ============================================================================

/**
 * Convert a number array (from JSON) to Float32Array for efficient computation.
 * Minimizes allocations by reusing the typed array pattern.
 */
export function toFloat32Array(arr: number[]): Float32Array {
  return new Float32Array(arr);
}

/**
 * Compute cosine similarity between two vectors.
 * Both vectors must be the same length.
 * Returns a value between -1 and 1 (typically 0 to 1 for normalized embeddings).
 *
 * Uses Float32Array for memory efficiency.
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
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

  if (magnitude === 0) {
    return 0;
  }

  return dotProduct / magnitude;
}

/**
 * Find top-k most similar vectors to a query vector.
 * Returns indices sorted by similarity (descending), with ties broken by index (ascending).
 *
 * @param queryVector - The query embedding as Float32Array
 * @param candidates - Array of candidate embeddings as Float32Arrays
 * @param k - Number of top results to return
 * @returns Array of { index, score } sorted by score desc, then index asc
 */
export function topKSimilar(
  queryVector: Float32Array,
  candidates: Float32Array[],
  k: number
): Array<{ index: number; score: number }> {
  // Compute similarities
  const scored = candidates.map((candidate, index) => ({
    index,
    score: cosineSimilarity(queryVector, candidate),
  }));

  // Sort by score descending, then index ascending for determinism
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.index - b.index;
  });

  return scored.slice(0, k);
}
