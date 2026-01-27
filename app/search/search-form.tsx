"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface SearchFormProps {
  initialQuery: string;
  initialMode: "keyword" | "semantic";
}

export function SearchForm({ initialQuery, initialMode }: SearchFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState<"keyword" | "semantic">(initialMode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    startTransition(() => {
      const params = new URLSearchParams();
      params.set("q", query.trim());
      if (mode !== "keyword") {
        params.set("mode", mode);
      }
      router.push(`/search?${params.toString()}`);
    });
  };

  const handleModeChange = (newMode: "keyword" | "semantic") => {
    setMode(newMode);
    if (query.trim()) {
      startTransition(() => {
        const params = new URLSearchParams();
        params.set("q", query.trim());
        if (newMode !== "keyword") {
          params.set("mode", newMode);
        }
        router.push(`/search?${params.toString()}`);
      });
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for verses, places, prayers..."
          className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg"
          aria-label="Search query"
        />
        <button
          type="submit"
          disabled={isPending || !query.trim()}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isPending ? "..." : "Search"}
        </button>
      </form>

      {/* Mode Toggle */}
      <div className="flex items-center justify-center gap-4 text-sm">
        <span className="text-muted-foreground">Search mode:</span>
        <div className="flex border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => handleModeChange("keyword")}
            className={`px-4 py-2 transition-colors ${
              mode === "keyword"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            Keyword
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("semantic")}
            className={`px-4 py-2 transition-colors ${
              mode === "semantic"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
            title="Semantic search uses AI to find related content"
          >
            Semantic
          </button>
        </div>
      </div>
    </div>
  );
}
