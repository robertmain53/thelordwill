/**
 * Prisma Query Helpers for Published Content
 *
 * Provides deterministic, type-safe helpers for filtering by publish status.
 * Use these instead of inline { status: "published" } to ensure consistency.
 */

import { Prisma } from "@prisma/client";

// ============================================================================
// Types
// ============================================================================

/**
 * Valid publish states for content entities
 */
export type PublishStatus = "draft" | "published";

/**
 * Models that have status field for publish gating
 */
export type PublishableModel =
  | "situation"
  | "profession"
  | "prayerPoint"
  | "place"
  | "travelItinerary";

// ============================================================================
// Where Clause Helpers
// ============================================================================

/**
 * Returns a where clause for published-only filtering
 * Use in findMany/findFirst for public-facing queries
 *
 * @example
 * prisma.situation.findMany({ where: wherePublished() })
 */
export function wherePublished(): { status: "published" } {
  return { status: "published" };
}

/**
 * Returns a where clause for a specific status
 * Use when you need to query by status dynamically
 *
 * @example
 * prisma.situation.findMany({ where: whereStatus("draft") })
 */
export function whereStatus(status: PublishStatus): { status: PublishStatus } {
  return { status };
}

/**
 * Returns a combined where clause with slug and published status
 * Use for detail pages that need both slug match and publish gate
 *
 * @example
 * prisma.situation.findFirst({ where: whereSlugPublished(slug) })
 */
export function whereSlugPublished(slug: string): {
  slug: string;
  status: "published";
} {
  return { slug, status: "published" };
}

// ============================================================================
// Search Helpers
// ============================================================================

/**
 * Returns a safe "contains" filter for search queries
 * Returns undefined if query is empty/null, preventing invalid Prisma shapes
 *
 * @param q - The search query string (can be null/undefined/empty)
 * @param mode - Search mode: "insensitive" (default) or "default"
 * @returns Prisma StringFilter or undefined
 *
 * @example
 * const searchFilter = safeContains(searchParams.q);
 * prisma.place.findMany({
 *   where: {
 *     ...wherePublished(),
 *     ...(searchFilter && { name: searchFilter }),
 *   }
 * })
 */
export function safeContains(
  q: string | null | undefined,
  mode: Prisma.QueryMode = "insensitive"
): { contains: string; mode: Prisma.QueryMode } | undefined {
  const trimmed = q?.trim();
  if (!trimmed) return undefined;
  return { contains: trimmed, mode };
}

/**
 * Returns a safe "startsWith" filter for search queries
 * Returns undefined if query is empty/null
 */
export function safeStartsWith(
  q: string | null | undefined,
  mode: Prisma.QueryMode = "insensitive"
): { startsWith: string; mode: Prisma.QueryMode } | undefined {
  const trimmed = q?.trim();
  if (!trimmed) return undefined;
  return { startsWith: trimmed, mode };
}

/**
 * Validates and returns a slug, or null if invalid
 * Prevents empty/whitespace-only slugs from being used in queries
 */
export function safeSlug(slug: string | null | undefined): string | null {
  const trimmed = slug?.trim();
  if (!trimmed) return null;
  return trimmed;
}

// ============================================================================
// Ordering Helpers
// ============================================================================

/**
 * Standard ordering for content lists
 */
export const orderByUpdatedDesc = { updatedAt: "desc" as const };
export const orderByTitleAsc = { title: "asc" as const };
export const orderByNameAsc = { name: "asc" as const };
export const orderByPriorityDesc = { priority: "desc" as const };

/**
 * Combined orderings for common list patterns
 */
export const orderByPriorityThenTitle = [
  { priority: "desc" as const },
  { title: "asc" as const },
];

export const orderByUpdatedThenTitle = [
  { updatedAt: "desc" as const },
  { title: "asc" as const },
];

export const orderByTourPriorityThenName = [
  { tourPriority: "desc" as const },
  { name: "asc" as const },
];

// ============================================================================
// Combine Helpers
// ============================================================================

/**
 * Combines wherePublished() with additional filters
 * Convenience for building complex where clauses
 *
 * @example
 * prisma.prayerPoint.findMany({
 *   where: publishedWhere({ category: "healing" })
 * })
 */
export function publishedWhere<T extends Record<string, unknown>>(
  additionalFilters: T
): T & { status: "published" } {
  return { ...additionalFilters, status: "published" };
}

/**
 * For models that don't have status (like Name, TourLead for leads)
 * Returns empty object so queries don't break
 */
export function noStatusFilter(): Record<string, never> {
  return {};
}
