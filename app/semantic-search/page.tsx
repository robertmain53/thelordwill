"use client";

import { useState, FormEvent } from "react";

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

export default function SemanticSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setError("Query must be at least 3 characters");
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const params = new URLSearchParams({ q: trimmed, k: "10" });
      const response = await fetch(`/api/semantic-search/verses?${params}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Search failed");
      }

      const data: SearchResponse = await response.json();
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Semantic Verse Search</h1>
      <p className="text-muted-foreground mb-6">
        Search for Bible verses by meaning, not just keywords.
      </p>

      <form onSubmit={handleSubmit} className="mb-8">
        <label htmlFor="search-query" className="block text-sm font-medium mb-2">
          Search Query
        </label>
        <div className="flex gap-3">
          <input
            id="search-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., comfort in times of trouble"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || query.trim().length < 3}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {searched && !loading && !error && results.length === 0 && (
        <div className="p-4 mb-6 bg-gray-50 text-gray-600 rounded-lg">
          No results found. Try a different search query.
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Results ({results.length})
          </h2>
          <ul className="space-y-4">
            {results.map((result) => (
              <li
                key={result.verseId}
                className="p-4 border rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="font-medium text-blue-600 mb-1">
                      Book {result.bookId}, Chapter {result.chapter}:{result.verseNumber}
                    </div>
                    <p className="text-gray-700">
                      {result.text.length > 200
                        ? result.text.slice(0, 200) + "..."
                        : result.text}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500 whitespace-nowrap">
                    {(result.score * 100).toFixed(1)}%
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
