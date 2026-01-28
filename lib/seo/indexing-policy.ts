/**
 * Indexing Policy Module
 *
 * Deterministic rules for:
 * - Admin routes: noindex, nofollow
 * - Draft content: 404 (handled at page level)
 * - ES/PT fallback detection: noindex when serving English content
 * - Canonical URL generation
 */

import { getCanonicalUrl } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface RobotsMetaResult {
  /** Value for <meta name="robots" content="..."> */
  metaRobots?: string;
  /** Value for X-Robots-Tag header */
  xRobotsTag?: string;
}

export interface FallbackDetectionArgs {
  /** The locale being served (e.g., "es", "pt") */
  locale: string;
  /** The content text to analyze */
  content: string;
  /** Optional: metaDescription for additional analysis */
  metaDescription?: string;
}

export interface CanonicalFallbackArgs {
  /** The current path without locale prefix (e.g., "/prayer-points/healing") */
  path: string;
  /** The fallback locale to use (defaults to "en") */
  fallbackLocale?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Spanish stopwords for fallback detection */
const SPANISH_STOPWORDS = [
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "de",
  "del",
  "al",
  "y",
  "o",
  "en",
  "que",
  "es",
  "para",
  "por",
  "con",
  "como",
  "pero",
  "se",
  "su",
  "sus",
  "este",
  "esta",
  "estos",
  "estas",
  "ese",
  "esa",
  "esos",
  "esas",
  "mi",
  "tu",
  "nos",
  "les",
];

/** Portuguese stopwords for fallback detection */
const PORTUGUESE_STOPWORDS = [
  "o",
  "a",
  "os",
  "as",
  "um",
  "uma",
  "uns",
  "umas",
  "de",
  "do",
  "da",
  "dos",
  "das",
  "em",
  "no",
  "na",
  "nos",
  "nas",
  "e",
  "ou",
  "que",
  "para",
  "por",
  "com",
  "como",
  "mas",
  "se",
  "seu",
  "sua",
  "seus",
  "suas",
  "este",
  "esta",
  "estes",
  "estas",
  "esse",
  "essa",
  "esses",
  "essas",
  "meu",
  "minha",
  "teu",
  "tua",
];

/** ASCII threshold for fallback detection (percentage) */
const ASCII_THRESHOLD = 0.7;

/** Minimum stopword count to consider content translated */
const MIN_STOPWORD_COUNT = 3;

// ============================================================================
// Admin Route Detection
// ============================================================================

/**
 * Checks if a path is an admin route.
 */
export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/admin");
}

/**
 * Gets robots directives for admin routes.
 * Admin routes should never be indexed.
 */
export function robotsMetaForAdmin(): RobotsMetaResult {
  return {
    metaRobots: "noindex, nofollow",
    xRobotsTag: "noindex, nofollow",
  };
}

// ============================================================================
// Fallback Translation Detection
// ============================================================================

/**
 * Counts words in text that are ASCII-only (a-z, numbers, common punctuation).
 */
function countAsciiWords(text: string): { ascii: number; total: number } {
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const total = words.length;

  // ASCII word: only contains a-z, 0-9, apostrophe, hyphen
  const asciiWords = words.filter((w) => /^[a-z0-9'-]+$/.test(w));

  return { ascii: asciiWords.length, total };
}

/**
 * Counts target language stopwords in text.
 */
function countStopwords(text: string, stopwords: string[]): number {
  const words = text.toLowerCase().split(/\s+/);
  const stopwordSet = new Set(stopwords);
  return words.filter((w) => stopwordSet.has(w)).length;
}

/**
 * Detects if content is a fallback (English served for non-EN locale).
 *
 * Heuristic:
 * 1. Content is >=70% ASCII words
 * 2. Content has <3 stopwords from the target language
 *
 * This is deterministic and does not require external services.
 */
export function isFallbackTranslation(args: FallbackDetectionArgs): boolean {
  const { locale, content, metaDescription } = args;

  // Only applies to non-English locales
  if (locale === "en" || !locale) {
    return false;
  }

  // Combine content and metaDescription for analysis
  const textToAnalyze = [content, metaDescription].filter(Boolean).join(" ");

  if (!textToAnalyze || textToAnalyze.trim().length === 0) {
    // Empty content defaults to fallback (safe default)
    return true;
  }

  // Check ASCII percentage
  const { ascii, total } = countAsciiWords(textToAnalyze);
  if (total === 0) return true;

  const asciiRatio = ascii / total;

  // Get stopwords based on locale
  let stopwords: string[] = [];
  if (locale === "es") {
    stopwords = SPANISH_STOPWORDS;
  } else if (locale === "pt") {
    stopwords = PORTUGUESE_STOPWORDS;
  }

  // Count target language stopwords
  const stopwordCount = countStopwords(textToAnalyze, stopwords);

  // Fallback if:
  // - High ASCII ratio (>=70%) AND
  // - Low stopword count (<3 target language stopwords)
  return asciiRatio >= ASCII_THRESHOLD && stopwordCount < MIN_STOPWORD_COUNT;
}

// ============================================================================
// Robots Meta Generation
// ============================================================================

/**
 * Generates robots meta directives for a page.
 *
 * Rules:
 * 1. Admin routes: noindex, nofollow
 * 2. ES/PT fallback pages: noindex, follow
 * 3. Published content: index, follow (default, returns undefined)
 */
export function robotsMetaForPage(args: {
  pathname: string;
  locale?: string;
  content?: string;
  metaDescription?: string;
}): RobotsMetaResult {
  const { pathname, locale, content, metaDescription } = args;

  // Admin routes
  if (isAdminRoute(pathname)) {
    return robotsMetaForAdmin();
  }

  // Fallback translation detection for non-EN locales
  if (locale && locale !== "en" && content) {
    if (isFallbackTranslation({ locale, content, metaDescription })) {
      return {
        metaRobots: "noindex, follow",
        // No X-Robots-Tag needed for fallback - handled in meta
      };
    }
  }

  // Default: allow indexing (return empty object)
  return {};
}

// ============================================================================
// Canonical URL Generation
// ============================================================================

/**
 * Generates canonical URL for fallback pages.
 * Points to the English version of the same resource.
 */
export function canonicalForFallback(args: CanonicalFallbackArgs): string {
  const { path, fallbackLocale = "en" } = args;

  // Remove any existing locale prefix from path
  const pathWithoutLocale = path.replace(/^\/(en|es|pt)/, "");

  // Generate canonical URL with English locale
  return getCanonicalUrl(`/${fallbackLocale}${pathWithoutLocale}`);
}

/**
 * Gets the appropriate canonical URL for a page.
 *
 * - If fallback translation: points to EN version
 * - Otherwise: points to self
 */
export function getCanonicalForPage(args: {
  pathname: string;
  locale?: string;
  content?: string;
  metaDescription?: string;
}): string {
  const { pathname, locale, content, metaDescription } = args;

  // For non-EN locales, check if fallback
  if (locale && locale !== "en" && content) {
    if (isFallbackTranslation({ locale, content, metaDescription })) {
      return canonicalForFallback({ path: pathname });
    }
  }

  // Default: canonical is self
  return getCanonicalUrl(pathname);
}

// ============================================================================
// Export Summary
// ============================================================================

export const indexingPolicy = {
  isAdminRoute,
  isFallbackTranslation,
  robotsMetaForPage,
  robotsMetaForAdmin,
  canonicalForFallback,
  getCanonicalForPage,
};
