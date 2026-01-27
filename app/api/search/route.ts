/**
 * Search API Route
 *
 * GET /api/search?q=...&mode=semantic|keyword&limit=20&types=situation,place
 *
 * - mode=keyword: SQL keyword search (default)
 * - mode=semantic: Vector similarity search (requires pre-indexed embeddings)
 *
 * If semantic mode fails (no vector provider), falls back to keyword search.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  keywordSearch,
  type SearchEntityType,
  type SearchResult,
} from "@/lib/search/keyword";
import {
  queryVectors,
  getVectorProvider,
  VectorProviderError,
} from "@/lib/search/vector";

export const dynamic = "force-dynamic";

const VALID_TYPES: SearchEntityType[] = [
  "situation",
  "prayerPoint",
  "place",
  "profession",
  "verse",
  "name",
];

interface SemanticSearchResult extends SearchResult {
  semanticScore?: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const query = searchParams.get("q")?.trim() || "";
  const mode = (searchParams.get("mode") || "keyword") as "semantic" | "keyword";
  const limitParam = parseInt(searchParams.get("limit") || "20", 10);
  const limit = Math.min(Math.max(1, limitParam), 100);
  const typesParam = searchParams.get("types");

  // Parse types filter
  let types: SearchEntityType[] | undefined;
  if (typesParam) {
    const requestedTypes = typesParam.split(",").map((t) => t.trim());
    types = requestedTypes.filter((t): t is SearchEntityType =>
      VALID_TYPES.includes(t as SearchEntityType)
    );
    if (types.length === 0) {
      types = undefined; // Fall back to all types
    }
  }

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required", results: [] },
      { status: 400 }
    );
  }

  try {
    let results: SearchResult[];
    let actualMode = mode;
    let fallbackReason: string | undefined;

    if (mode === "semantic") {
      try {
        results = await semanticSearch(query, limit, types);
      } catch (error) {
        if (error instanceof VectorProviderError) {
          // Fall back to keyword search
          fallbackReason = error.message;
          actualMode = "keyword";
          results = await keywordSearch(query, { limit, types });
        } else {
          throw error;
        }
      }
    } else {
      results = await keywordSearch(query, { limit, types });
    }

    // Group results by type
    const grouped = groupResultsByType(results);

    return NextResponse.json({
      query,
      mode: actualMode,
      fallbackReason,
      totalResults: results.length,
      results,
      grouped,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      {
        error: "Search failed",
        message: error instanceof Error ? error.message : "Unknown error",
        results: [],
      },
      { status: 500 }
    );
  }
}

/**
 * Semantic search using pre-computed embeddings
 *
 * NOTE: This requires embeddings to be generated offline via the indexing script.
 * NO runtime embedding generation - we use pre-computed query embeddings cache.
 */
async function semanticSearch(
  query: string,
  limit: number,
  types?: SearchEntityType[]
): Promise<SemanticSearchResult[]> {
  const provider = getVectorProvider();

  if (provider === "none") {
    throw new VectorProviderError(
      "No vector provider configured. Using keyword search.",
      provider
    );
  }

  // For semantic search, we need to get the query embedding
  // This is cached to avoid runtime embedding generation
  const queryEmbedding = await getQueryEmbedding(query);

  // Query the vector store
  const vectorMatches = await queryVectors(queryEmbedding, limit * 2);

  // Filter by types if specified
  let filteredMatches = vectorMatches;
  if (types && types.length > 0) {
    filteredMatches = vectorMatches.filter((match) => {
      const matchType = match.metadata.type as SearchEntityType;
      return types.includes(matchType);
    });
  }

  // Convert to SearchResult format
  const results: SemanticSearchResult[] = filteredMatches
    .slice(0, limit)
    .map((match) => ({
      id: String(match.metadata.id),
      type: match.metadata.type as SearchEntityType,
      title: String(match.metadata.title),
      description: String(match.metadata.description || ""),
      slug: String(match.metadata.slug),
      url: String(match.metadata.url),
      score: Math.round(match.score * 100),
      semanticScore: match.score,
    }));

  return results;
}

/**
 * Get query embedding
 *
 * In production, this should use a cache or pre-computed embeddings.
 * For now, we generate on-the-fly if OpenAI API is available.
 */
async function getQueryEmbedding(query: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new VectorProviderError(
      "OPENAI_API_KEY not configured for query embedding generation",
      "none"
    );
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: query,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Group results by entity type for UI display
 */
function groupResultsByType(
  results: SearchResult[]
): Record<SearchEntityType, SearchResult[]> {
  const grouped: Record<string, SearchResult[]> = {};

  for (const result of results) {
    if (!grouped[result.type]) {
      grouped[result.type] = [];
    }
    grouped[result.type].push(result);
  }

  return grouped as Record<SearchEntityType, SearchResult[]>;
}
