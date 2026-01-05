'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Interactive Island: Search Bar Component
 * This is one of the few client-side components for interactivity
 * Uses 'use client' directive for selective hydration
 */
export function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }, [query, router]);

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search biblical names, verses, or topics..."
          className="w-full px-4 py-3 pr-12 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Search"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          aria-label="Search"
        >
          Search
        </button>
      </div>
    </form>
  );
}
