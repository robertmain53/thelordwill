/**
 * Poster Provider Abstraction
 * Supports multiple image generation backends: Placid, TailGraph, or placeholder
 * Deterministic caching via filesystem cache
 */

import fs from "fs";
import path from "path";

type PosterProvider = "placid" | "tailgraph" | "none";

interface PosterInput {
  type: "situation" | "profession" | "name";
  slug: string;
  verseRef: string; // e.g., "John 3:16"
  verseText: string;
}

interface CacheEntry {
  url: string;
  createdAt: string;
  provider: PosterProvider;
}

type PosterCache = Record<string, CacheEntry>;

const CACHE_DIR = ".cache";
const CACHE_FILE = path.join(CACHE_DIR, "posters.json");

/**
 * Get the configured poster provider from environment
 */
function getProvider(): PosterProvider {
  const provider = process.env.POSTER_PROVIDER?.toLowerCase() as PosterProvider;
  if (provider === "placid" || provider === "tailgraph") {
    return provider;
  }
  return "none";
}

/**
 * Build cache key from poster input
 */
function buildCacheKey(input: PosterInput): string {
  // Normalize verse ref to create stable key
  const normalizedRef = input.verseRef.replace(/\s+/g, "-").toLowerCase();
  return `${input.type}:${input.slug}:${normalizedRef}`;
}

/**
 * Load poster cache from filesystem
 */
function loadCache(): PosterCache {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, "utf-8");
      return JSON.parse(data) as PosterCache;
    }
  } catch (error) {
    console.warn("Failed to load poster cache:", error);
  }
  return {};
}

/**
 * Save poster cache to filesystem
 */
function saveCache(cache: PosterCache): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.warn("Failed to save poster cache:", error);
  }
}

/**
 * Generate poster URL using Placid API
 * https://placid.app/docs/2.0/rest/images
 */
async function generatePlacidPoster(input: PosterInput): Promise<string> {
  const apiKey = process.env.PLACID_API_KEY;
  const templateId = process.env.PLACID_TEMPLATE_ID;

  if (!apiKey || !templateId) {
    console.warn("Placid API key or template ID not configured");
    return getPlaceholderUrl(input);
  }

  try {
    const response = await fetch("https://api.placid.app/api/rest/images", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template_uuid: templateId,
        layers: {
          verse_ref: { text: input.verseRef },
          verse_text: { text: input.verseText },
          category: { text: input.type.charAt(0).toUpperCase() + input.type.slice(1) },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Placid API error: ${response.status}`);
    }

    const data = await response.json();
    return data.image_url || getPlaceholderUrl(input);
  } catch (error) {
    console.error("Placid poster generation failed:", error);
    return getPlaceholderUrl(input);
  }
}

/**
 * Generate poster URL using TailGraph API
 * https://tailgraph.com/docs
 */
async function generateTailGraphPoster(input: PosterInput): Promise<string> {
  const apiKey = process.env.TAILGRAPH_API_KEY;

  if (!apiKey) {
    console.warn("TailGraph API key not configured");
    return getPlaceholderUrl(input);
  }

  try {
    // TailGraph uses URL-based generation
    const params = new URLSearchParams({
      title: input.verseRef,
      description: input.verseText.substring(0, 200),
      theme: "bible",
    });

    const response = await fetch(`https://api.tailgraph.com/generate?${params}`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`TailGraph API error: ${response.status}`);
    }

    const data = await response.json();
    return data.url || getPlaceholderUrl(input);
  } catch (error) {
    console.error("TailGraph poster generation failed:", error);
    return getPlaceholderUrl(input);
  }
}

/**
 * Get placeholder poster URL (uses OG image endpoint)
 */
function getPlaceholderUrl(input: PosterInput): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thelordwill.com";
  const params = new URLSearchParams({
    type: "poster",
    category: input.type,
    slug: input.slug,
    verse: input.verseRef,
  });
  return `${baseUrl}/api/og?${params}`;
}

/**
 * Get poster URL for a given input
 * Uses deterministic caching to avoid regenerating the same poster
 */
export async function getPosterUrl(input: PosterInput): Promise<string> {
  const cacheKey = buildCacheKey(input);
  const cache = loadCache();

  // Check cache first
  if (cache[cacheKey]) {
    return cache[cacheKey].url;
  }

  const provider = getProvider();
  let url: string;

  switch (provider) {
    case "placid":
      url = await generatePlacidPoster(input);
      break;
    case "tailgraph":
      url = await generateTailGraphPoster(input);
      break;
    case "none":
    default:
      url = getPlaceholderUrl(input);
      break;
  }

  // Cache the result
  cache[cacheKey] = {
    url,
    createdAt: new Date().toISOString(),
    provider,
  };
  saveCache(cache);

  return url;
}

/**
 * Get current provider name for display
 */
export function getCurrentProvider(): PosterProvider {
  return getProvider();
}

/**
 * Clear poster cache (useful for development)
 */
export function clearPosterCache(): void {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
    }
  } catch (error) {
    console.warn("Failed to clear poster cache:", error);
  }
}
