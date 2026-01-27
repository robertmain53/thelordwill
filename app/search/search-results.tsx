import Link from "next/link";

interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  slug: string;
  url: string;
  score: number;
}

interface SearchResponse {
  query: string;
  mode: string;
  fallbackReason?: string;
  totalResults: number;
  results: SearchResult[];
  grouped: Record<string, SearchResult[]>;
}

interface SearchResultsProps {
  query: string;
  mode: "keyword" | "semantic";
}

const TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  situation: { label: "Bible Verses For", icon: "📖" },
  prayerPoint: { label: "Prayer Points", icon: "🙏" },
  place: { label: "Bible Places", icon: "📍" },
  profession: { label: "Professions", icon: "💼" },
  verse: { label: "Bible Verses", icon: "✝️" },
  name: { label: "Biblical Names", icon: "👤" },
};

export async function SearchResults({ query, mode }: SearchResultsProps) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://thelordwill.com";
  const apiUrl = new URL("/api/search", baseUrl);
  apiUrl.searchParams.set("q", query);
  apiUrl.searchParams.set("mode", mode);
  apiUrl.searchParams.set("limit", "50");

  const response = await fetch(apiUrl.toString(), {
    cache: "no-store",
  });

  if (!response.ok) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Search failed. Please try again.</p>
      </div>
    );
  }

  const data: SearchResponse = await response.json();

  if (data.totalResults === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-xl text-muted-foreground">
          No results found for &ldquo;{query}&rdquo;
        </p>
        <p className="text-muted-foreground">
          Try different keywords or check your spelling
        </p>
      </div>
    );
  }

  // Get types with results, sorted by number of results
  const typesWithResults = Object.entries(data.grouped)
    .filter(([_, results]) => results.length > 0)
    .sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="space-y-8">
      {/* Results summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Found {data.totalResults} results for &ldquo;{query}&rdquo;
        </p>
        <p>
          Mode: {data.mode}
          {data.fallbackReason && (
            <span className="ml-2 text-amber-600">(fallback)</span>
          )}
        </p>
      </div>

      {/* Grouped Results */}
      {typesWithResults.map(([type, results]) => {
        const typeInfo = TYPE_LABELS[type] || { label: type, icon: "📄" };

        return (
          <section key={type} className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span>{typeInfo.icon}</span>
              <span>{typeInfo.label}</span>
              <span className="text-sm font-normal text-muted-foreground">
                ({results.length})
              </span>
            </h2>

            <div className="grid gap-3">
              {results.slice(0, 10).map((result) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={result.url}
                  className="block p-4 border rounded-lg hover:border-primary hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {result.title}
                      </h3>
                      <p className="text-muted-foreground line-clamp-2 text-sm">
                        {result.description}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {result.score}%
                    </div>
                  </div>
                </Link>
              ))}

              {results.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  + {results.length - 10} more results
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
