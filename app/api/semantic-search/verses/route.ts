/**
 * Semantic Verse Search API
 *
 * GET /api/semantic-search/verses
 *
 * Searches for Bible verses semantically similar to the query text
 * using stored embeddings in Postgres via Prisma.
 *
 * Query Parameters:
 *   q      - Search query (required, 3-300 chars)
 *   k      - Number of results (optional, default 10, max 20)
 *   model  - Embedding model (optional, default "text-embedding-3-small")
 *
 * Response:
 *   200 - Success with results array
 *   400 - Invalid parameters
 *   502 - Embedding provider error
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  createEmbeddingClient,
  normalizeText,
  getVerseText,
  toFloat32Array,
  topKSimilar,
  type VerseRecord,
} from "@/scripts/embeddings/_embeddings-lib";

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_MODEL = "text-embedding-3-small";
const DEFAULT_K = 10;
const MAX_K = 20;
const MIN_QUERY_LENGTH = 3;
const MAX_QUERY_LENGTH = 300;
const CANDIDATE_LIMIT = 5000;

// ============================================================================
// Types
// ============================================================================

interface SearchResult {
  verseId: number;
  bookId: number;
  chapter: number;
  verseNumber: number;
  text: string;
  score: number;
}

interface SearchResponse {
  query: string;
  model: string;
  k: number;
  results: SearchResult[];
}

interface ErrorResponse {
  error: string;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Validate and parse query parameters.
 */
function parseParams(searchParams: URLSearchParams): {
  valid: true;
  q: string;
  k: number;
  model: string;
} | {
  valid: false;
  error: string;
} {
  const q = searchParams.get("q");
  const kParam = searchParams.get("k");
  const model = searchParams.get("model") ?? DEFAULT_MODEL;

  // Validate q
  if (!q) {
    return { valid: false, error: "Missing required parameter: q" };
  }

  if (q.length < MIN_QUERY_LENGTH) {
    return { valid: false, error: `Query must be at least ${MIN_QUERY_LENGTH} characters` };
  }

  if (q.length > MAX_QUERY_LENGTH) {
    return { valid: false, error: `Query must be at most ${MAX_QUERY_LENGTH} characters` };
  }

  // Validate k
  let k = DEFAULT_K;
  if (kParam !== null) {
    const parsed = parseInt(kParam, 10);
    if (isNaN(parsed) || parsed < 1) {
      return { valid: false, error: "Parameter k must be a positive integer" };
    }
    k = Math.min(parsed, MAX_K);
  }

  return { valid: true, q, k, model };
}

/**
 * Get normalized text for a verse using the same priority rules as the embedding script.
 */
function getVerseDisplayText(verse: {
  textKjv: string | null;
  textWeb: string | null;
  textAsv: string | null;
  textRV: string | null;
  textBL: string | null;
}): string {
  const text = getVerseText(verse as VerseRecord);
  return text ? normalizeText(text) : "";
}

// ============================================================================
// Route Handler
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<SearchResponse | ErrorResponse>> {
  const { searchParams } = request.nextUrl;

  // Parse and validate parameters
  const params = parseParams(searchParams);
  if (!params.valid) {
    return NextResponse.json({ error: params.error }, { status: 400 });
  }

  const { q, k, model } = params;

  try {
    // Fetch candidate embeddings from DB
    // Ordered by updatedAt DESC for deterministic selection
    const candidates = await prisma.verseEmbedding.findMany({
      where: {
        model: model,
      },
      select: {
        verseId: true,
        vector: true,
        verse: {
          select: {
            id: true,
            bookId: true,
            chapter: true,
            verseNumber: true,
            textKjv: true,
            textWeb: true,
            textAsv: true,
            textRV: true,
            textBL: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: CANDIDATE_LIMIT,
    });

    // If no embeddings available, return empty results
    if (candidates.length === 0) {
      return NextResponse.json({
        query: q,
        model,
        k,
        results: [],
      });
    }

    // Get embedding for the query
    let queryEmbedding: number[];
    try {
      const client = createEmbeddingClient(model);
      const embeddings = await client.getEmbeddings([q]);
      queryEmbedding = embeddings[0];
    } catch (error) {
      console.error("Embedding provider error:", error);
      return NextResponse.json(
        { error: "embedding_provider_error" },
        { status: 502 }
      );
    }

    // Convert query embedding to Float32Array
    const queryVector = toFloat32Array(queryEmbedding);

    // Convert candidate vectors to Float32Arrays
    // The vector is stored as Json (number[])
    const candidateVectors = candidates.map((c) =>
      toFloat32Array(c.vector as number[])
    );

    // Find top-k similar vectors
    const topK = topKSimilar(queryVector, candidateVectors, k);

    // Build results with verse data
    // For deterministic ordering with equal scores, topKSimilar already sorts by index ASC
    // But we need to sort by verseId ASC for equal scores, so re-sort here
    const resultsWithVerseId = topK.map((item) => {
      const candidate = candidates[item.index];
      return {
        verseId: candidate.verse.id,
        bookId: candidate.verse.bookId,
        chapter: candidate.verse.chapter,
        verseNumber: candidate.verse.verseNumber,
        text: getVerseDisplayText(candidate.verse),
        score: item.score,
      };
    });

    // Sort by score descending, then verseId ascending for determinism
    resultsWithVerseId.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.verseId - b.verseId;
    });

    return NextResponse.json({
      query: q,
      model,
      k,
      results: resultsWithVerseId,
    });
  } catch (error) {
    console.error("Semantic search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
