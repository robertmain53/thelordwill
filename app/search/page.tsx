import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchForm } from "./search-form";
import { SearchResults } from "./search-results";

export const metadata: Metadata = {
  title: "Search - The Lord Will",
  description:
    "Search for Bible verses, biblical places, prayer points, professions, and biblical names.",
  robots: {
    index: false,
    follow: true,
  },
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string; mode?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || "";
  const mode = (params.mode as "keyword" | "semantic") || "keyword";

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">Search</h1>
          <p className="text-xl text-muted-foreground">
            Find Bible verses, places, prayer points, and more
          </p>
        </div>

        {/* Search Form */}
        <SearchForm initialQuery={query} initialMode={mode} />

        {/* Results */}
        {query && (
          <Suspense
            fallback={
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">Searching...</p>
              </div>
            }
          >
            <SearchResults query={query} mode={mode} />
          </Suspense>
        )}

        {/* No query state */}
        {!query && (
          <div className="text-center py-12 space-y-6">
            <p className="text-muted-foreground">
              Enter a search term to find relevant content
            </p>

            {/* Popular searches */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Popular Searches</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "love",
                  "faith",
                  "healing",
                  "Jerusalem",
                  "peace",
                  "forgiveness",
                  "strength",
                  "wisdom",
                ].map((term) => (
                  <Link
                    key={term}
                    href={`/search?q=${encodeURIComponent(term)}`}
                    className="px-4 py-2 border rounded-full hover:bg-muted transition-colors"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
