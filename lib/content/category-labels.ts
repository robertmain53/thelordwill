/**
 * Centralized Category Label Mapping
 *
 * Provides deterministic, consistent category label handling across:
 * - Public listing pages (Prayer Points, Situations)
 * - Admin listing pages
 * - Any component displaying category information
 *
 * Key principles:
 * - DB stores category slugs (stable keys)
 * - UI displays human-friendly labels
 * - Unknown slugs fall back to Title Case
 * - Grouping remains by slug (stable even if labels change)
 * - Sorting is deterministic (by order, then by label)
 */

// ============================================================================
// Types
// ============================================================================

export interface CategoryLabelConfig {
  label: string;
  order: number;
}

export interface CategoryGroup<T> {
  slug: string;
  label: string;
  order: number;
  items: T[];
}

export type CategoryScope = "prayerPointCategory" | "situationCategory";

// ============================================================================
// Static Category Labels (Fallback/Default)
// ============================================================================

/**
 * Known category labels with display names and sort order.
 * These serve as fallbacks when TaxonomyLabel records don't exist.
 *
 * To add a new category:
 * 1. Add entry here with slug, label, and order
 * 2. Optionally add to TaxonomyLabel table for DB-driven config
 */
export const CATEGORY_LABELS: Record<string, CategoryLabelConfig> = {
  // Prayer Point categories
  breakthrough: { label: "Breakthrough", order: 10 },
  healing: { label: "Healing", order: 20 },
  protection: { label: "Protection", order: 30 },
  "peace-over-fear": { label: "Peace Over Fear", order: 40 },
  deliverance: { label: "Deliverance", order: 50 },
  provision: { label: "Provision", order: 60 },
  family: { label: "Family", order: 70 },
  encouragement: { label: "Encouragement", order: 80 },
  guidance: { label: "Guidance", order: 85 },
  faith: { label: "Faith", order: 90 },
  forgiveness: { label: "Forgiveness", order: 95 },
  gratitude: { label: "Gratitude", order: 100 },
  strength: { label: "Strength", order: 105 },
  wisdom: { label: "Wisdom", order: 110 },

  // Situation categories
  relationships: { label: "Relationships", order: 10 },
  "work-career": { label: "Work & Career", order: 20 },
  health: { label: "Health", order: 30 },
  finances: { label: "Finances", order: 40 },
  "spiritual-growth": { label: "Spiritual Growth", order: 50 },
  "grief-loss": { label: "Grief & Loss", order: 60 },
  anxiety: { label: "Anxiety", order: 70 },
  depression: { label: "Depression", order: 75 },
  addiction: { label: "Addiction", order: 80 },
  parenting: { label: "Parenting", order: 85 },
  marriage: { label: "Marriage", order: 90 },

  // Fallback
  other: { label: "Other", order: 999 },
};

// ============================================================================
// Slug Normalization
// ============================================================================

/**
 * Normalizes a category input to a consistent slug format.
 * - Trims whitespace
 * - Converts to lowercase
 * - Replaces spaces/underscores with hyphens
 * - Removes non-alphanumeric characters (except hyphens)
 * - Collapses multiple hyphens
 * - Returns "other" for empty/null input
 *
 * @example
 * normalizeCategorySlug("Peace Over Fear") // "peace-over-fear"
 * normalizeCategorySlug("  HEALING  ")     // "healing"
 * normalizeCategorySlug(null)              // "other"
 * normalizeCategorySlug("")                // "other"
 */
export function normalizeCategorySlug(input: string | null | undefined): string {
  const trimmed = (input || "").trim();
  if (!trimmed) return "other";

  return trimmed
    .toLowerCase()
    .replace(/[\s_]+/g, "-") // spaces/underscores to hyphens
    .replace(/[^a-z0-9-]/g, "") // remove invalid chars
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-|-$/g, ""); // trim leading/trailing hyphens
}

// ============================================================================
// Label Resolution
// ============================================================================

/**
 * Converts a slug to Title Case for display fallback.
 * @example
 * toTitleCase("peace-over-fear") // "Peace Over Fear"
 * toTitleCase("healing")         // "Healing"
 */
function toTitleCase(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Gets the display label for a category slug.
 * Resolution order:
 * 1. Known CATEGORY_LABELS mapping
 * 2. Title Case conversion of slug
 *
 * @example
 * getCategoryLabel("breakthrough")    // "Breakthrough"
 * getCategoryLabel("weird-custom")    // "Weird Custom"
 * getCategoryLabel(null)              // "Other"
 */
export function getCategoryLabel(slug: string | null | undefined): string {
  const normalized = normalizeCategorySlug(slug);
  const config = CATEGORY_LABELS[normalized];
  if (config) return config.label;
  return toTitleCase(normalized);
}

/**
 * Gets the sort order for a category slug.
 * Unknown categories get order 900 (before "other" at 999).
 */
export function getCategoryOrder(slug: string | null | undefined): number {
  const normalized = normalizeCategorySlug(slug);
  const config = CATEGORY_LABELS[normalized];
  return config?.order ?? 900;
}

/**
 * Gets both label and order for a category slug.
 */
export function getCategoryConfig(
  slug: string | null | undefined
): CategoryLabelConfig {
  const normalized = normalizeCategorySlug(slug);
  const config = CATEGORY_LABELS[normalized];
  if (config) return config;
  return { label: toTitleCase(normalized), order: 900 };
}

// ============================================================================
// Sorting
// ============================================================================

/**
 * Sorts category slugs by order, then by label (alphabetically).
 * Returns a new array (does not mutate input).
 *
 * @example
 * sortCategorySlugs(["other", "healing", "breakthrough"])
 * // ["breakthrough", "healing", "other"]
 */
export function sortCategorySlugs(slugs: string[]): string[] {
  return [...slugs].sort((a, b) => {
    const configA = getCategoryConfig(a);
    const configB = getCategoryConfig(b);

    // Primary: sort by order
    if (configA.order !== configB.order) {
      return configA.order - configB.order;
    }

    // Secondary: sort by label alphabetically
    return configA.label.localeCompare(configB.label, "en");
  });
}

// ============================================================================
// Grouping
// ============================================================================

/**
 * Groups items by category slug with stable output ordering.
 * Returns groups sorted by order, then by label.
 *
 * @param items - Array of items to group
 * @param getSlug - Function to extract category slug from item
 * @returns Array of groups with slug, label, order, and items
 *
 * @example
 * const groups = groupByCategorySlug(prayerPoints, (p) => p.category);
 * // [
 * //   { slug: "breakthrough", label: "Breakthrough", order: 10, items: [...] },
 * //   { slug: "healing", label: "Healing", order: 20, items: [...] },
 * //   ...
 * // ]
 */
export function groupByCategorySlug<T>(
  items: T[],
  getSlug: (item: T) => string | null | undefined
): CategoryGroup<T>[] {
  const groups = new Map<string, CategoryGroup<T>>();

  for (const item of items) {
    const rawSlug = getSlug(item);
    const slug = normalizeCategorySlug(rawSlug);
    const config = getCategoryConfig(slug);

    const existing = groups.get(slug);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(slug, {
        slug,
        label: config.label,
        order: config.order,
        items: [item],
      });
    }
  }

  // Sort groups by order, then by label
  return Array.from(groups.values()).sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.label.localeCompare(b.label, "en");
  });
}

// ============================================================================
// DB Integration Helpers
// ============================================================================

/**
 * Merges DB-fetched labels with static fallbacks.
 * DB labels take precedence over static ones.
 *
 * @param dbLabels - Labels fetched from TaxonomyLabel table
 * @returns Merged label map
 */
export function mergeLabelMaps(
  dbLabels: Array<{ key: string; label: string; sortOrder?: number | null }>
): Map<string, CategoryLabelConfig> {
  const map = new Map<string, CategoryLabelConfig>();

  // Start with static fallbacks
  for (const [slug, config] of Object.entries(CATEGORY_LABELS)) {
    map.set(slug, config);
  }

  // Override with DB values
  for (const row of dbLabels) {
    const slug = normalizeCategorySlug(row.key);
    map.set(slug, {
      label: row.label,
      order: row.sortOrder ?? 900,
    });
  }

  return map;
}

/**
 * Groups items using DB labels merged with static fallbacks.
 * Use this when you have fetched TaxonomyLabel records.
 *
 * @param items - Array of items to group
 * @param getSlug - Function to extract category slug from item
 * @param dbLabels - Labels fetched from TaxonomyLabel table
 * @returns Array of groups with slug, label, order, and items
 */
export function groupByCategorySlugWithDbLabels<T>(
  items: T[],
  getSlug: (item: T) => string | null | undefined,
  dbLabels: Array<{ key: string; label: string; sortOrder?: number | null }>
): CategoryGroup<T>[] {
  const labelMap = mergeLabelMaps(dbLabels);
  const groups = new Map<string, CategoryGroup<T>>();

  for (const item of items) {
    const rawSlug = getSlug(item);
    const slug = normalizeCategorySlug(rawSlug);
    const config = labelMap.get(slug) ?? {
      label: toTitleCase(slug),
      order: 900,
    };

    const existing = groups.get(slug);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(slug, {
        slug,
        label: config.label,
        order: config.order,
        items: [item],
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.label.localeCompare(b.label, "en");
  });
}

// ============================================================================
// Admin Helpers
// ============================================================================

/**
 * Gets all known category options for admin forms.
 * Returns sorted array of { slug, label } pairs.
 */
export function getKnownCategoryOptions(): Array<{ slug: string; label: string }> {
  return Object.entries(CATEGORY_LABELS)
    .map(([slug, config]) => ({ slug, label: config.label, order: config.order }))
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.label.localeCompare(b.label, "en");
    })
    .map(({ slug, label }) => ({ slug, label }));
}

/**
 * Formats category display for admin lists.
 * Shows label as primary, slug as secondary (muted).
 *
 * @returns Object with label and slug for display
 */
export function formatCategoryForAdmin(
  slug: string | null | undefined
): { label: string; slug: string } {
  const normalizedSlug = normalizeCategorySlug(slug);
  const label = getCategoryLabel(normalizedSlug);
  return { label, slug: normalizedSlug };
}
