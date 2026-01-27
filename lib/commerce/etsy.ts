/**
 * Etsy Commerce Integration
 * Generates deep links to Etsy search results for verse posters
 */

type EtsyCategory = "bible-verse-poster" | "christian-art" | "scripture-wall-art";

interface EtsySearchInput {
  keywords: string[];
  category?: EtsyCategory;
  verseRef?: string;
}

/**
 * Category mappings to Etsy search parameters
 */
const CATEGORY_SEARCH_TERMS: Record<EtsyCategory, string[]> = {
  "bible-verse-poster": ["bible verse poster", "scripture print"],
  "christian-art": ["christian wall art", "religious art"],
  "scripture-wall-art": ["scripture wall art", "bible wall decor"],
};

/**
 * Build Etsy search URL with keywords and optional affiliate tracking
 */
export function buildEtsySearchUrl(input: EtsySearchInput): string {
  const baseUrl = "https://www.etsy.com/search";

  // Build search query
  const searchTerms: string[] = [];

  // Add category-specific terms
  if (input.category) {
    searchTerms.push(...CATEGORY_SEARCH_TERMS[input.category]);
  } else {
    // Default to bible verse poster category
    searchTerms.push("bible verse poster");
  }

  // Add verse reference if provided
  if (input.verseRef) {
    searchTerms.push(input.verseRef);
  }

  // Add custom keywords
  searchTerms.push(...input.keywords);

  // Build URL with query parameters
  const params = new URLSearchParams();
  params.set("q", searchTerms.join(" "));

  // Add affiliate ref if configured
  const affiliateRef = process.env.ETSY_AFFILIATE_REF;
  if (affiliateRef) {
    params.set("ref", affiliateRef);
  }

  // Sort by relevancy by default
  params.set("order", "most_relevant");

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Build Etsy search URL for a specific verse poster
 */
export function buildVersePostersUrl(verseRef: string, additionalKeywords?: string[]): string {
  return buildEtsySearchUrl({
    keywords: additionalKeywords || [],
    category: "bible-verse-poster",
    verseRef,
  });
}

/**
 * Build Etsy search URL for situation-specific posters
 */
export function buildSituationPosterUrl(situationTitle: string, verseRef?: string): string {
  // Extract key terms from situation title
  const keywords = situationTitle
    .toLowerCase()
    .replace(/bible verses (for|about)/gi, "")
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 3);

  return buildEtsySearchUrl({
    keywords,
    category: "scripture-wall-art",
    verseRef,
  });
}

/**
 * Get Etsy attribution text for compliance
 */
export function getEtsyAttribution(): string {
  return "Shop for prints on Etsy";
}
