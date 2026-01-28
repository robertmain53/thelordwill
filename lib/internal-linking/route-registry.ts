/**
 * Route Registry Module
 *
 * Deterministic route enumeration for QA validation.
 * Provides functions to list all public routes from static config and DB.
 */

// ============================================================================
// Static Routes
// ============================================================================

/**
 * Returns all known static public routes.
 * These are routes that exist regardless of DB content.
 */
export function getStaticPublicRoutes(): string[] {
  return [
    "/",
    "/about",
    "/editorial-process",
    "/prayer-points",
    "/prayer-points/today",
    "/bible-places",
    "/bible-travel",
    "/situations",
    "/professions",
    "/names",
    "/search",
  ].sort();
}

/**
 * Routes that should be excluded from click-depth analysis.
 * These are admin, API, system routes, etc.
 */
export function getExcludedPatterns(): RegExp[] {
  return [
    /^\/admin/,
    /^\/api\//,
    /^\/_next/,
    /^\/sitemap/,
    /^\/robots/,
    /^\/favicon/,
    /^\/login/,
    /^\/manifest/,
    /^\/sw\.js/,
    /^\[locale\]/, // Locale-prefixed routes (handled separately)
  ];
}

/**
 * Check if a path should be excluded from analysis.
 */
export function isExcludedRoute(path: string): boolean {
  const patterns = getExcludedPatterns();
  return patterns.some((pattern) => pattern.test(path));
}

// ============================================================================
// DB Routes (for use in QA scripts only - not runtime)
// ============================================================================

/**
 * Route pattern definitions for DB-backed entities.
 * Maps entity type to URL pattern.
 */
export const ROUTE_PATTERNS = {
  prayerPoint: "/prayer-points/:slug",
  place: "/bible-places/:slug",
  situation: "/bible-verses-for/:slug",
  profession: "/bible-verses-for/:slug",
  name: "/meaning-of/:slug/in-the-bible",
  itinerary: "/bible-travel/:slug",
} as const;

/**
 * Generate URL from pattern and slug.
 */
export function buildRouteUrl(pattern: string, slug: string): string {
  return pattern.replace(":slug", slug);
}

// ============================================================================
// Hub Page Configuration
// ============================================================================

/**
 * Hub pages and their entity types.
 * Used to verify that hub pages link to their detail pages.
 */
export const HUB_PAGES = {
  "/prayer-points": "prayerPoint",
  "/bible-places": "place",
  "/situations": "situation",
  "/professions": "profession",
  "/names": "name",
  "/bible-travel": "itinerary",
} as const;

/**
 * Get the hub page for an entity type.
 */
export function getHubForEntityType(entityType: string): string | null {
  for (const [hub, type] of Object.entries(HUB_PAGES)) {
    if (type === entityType) return hub;
  }
  return null;
}

// ============================================================================
// Link Extraction Helpers (for QA scripts)
// ============================================================================

/**
 * Extract internal links from HTML content.
 * Returns unique normalized paths.
 */
export function extractInternalLinks(html: string): string[] {
  const links = new Set<string>();

  // Match href attributes in anchor tags
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match;

  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1];

    // Skip external links
    if (href.startsWith("http://") || href.startsWith("https://")) {
      // Check if it's our domain
      if (!href.includes("thelordwill.com") && !href.includes("localhost")) {
        continue;
      }
      // Extract path from full URL
      try {
        const url = new URL(href);
        const path = url.pathname;
        if (path && path !== "#" && !isExcludedRoute(path)) {
          links.add(normalizePath(path));
        }
      } catch {
        continue;
      }
    } else if (href.startsWith("/")) {
      // Internal path
      const path = href.split("?")[0].split("#")[0];
      if (path && !isExcludedRoute(path)) {
        links.add(normalizePath(path));
      }
    }
    // Skip relative paths, hash links, javascript:, mailto:, etc.
  }

  return Array.from(links).sort();
}

/**
 * Normalize a URL path for consistent comparison.
 */
export function normalizePath(path: string): string {
  // Remove trailing slash (except for root)
  let normalized = path.replace(/\/+$/, "") || "/";
  // Remove query string
  normalized = normalized.split("?")[0];
  // Remove hash
  normalized = normalized.split("#")[0];
  return normalized;
}

// ============================================================================
// Depth Calculation (BFS)
// ============================================================================

export interface GraphNode {
  depth: number;
  path: string[];
}

/**
 * Compute shortest paths from source to all reachable nodes using BFS.
 */
export function computeDepths(
  graph: Map<string, Set<string>>,
  source: string
): Map<string, GraphNode> {
  const depths = new Map<string, GraphNode>();
  const queue: Array<{ url: string; depth: number; path: string[] }> = [];

  depths.set(source, { depth: 0, path: [source] });
  queue.push({ url: source, depth: 0, path: [source] });

  while (queue.length > 0) {
    const { url, depth, path } = queue.shift()!;

    const neighbors = graph.get(url) || new Set();
    for (const neighbor of neighbors) {
      if (!depths.has(neighbor)) {
        const newPath = [...path, neighbor];
        depths.set(neighbor, { depth: depth + 1, path: newPath });
        queue.push({ url: neighbor, depth: depth + 1, path: newPath });
      }
    }
  }

  return depths;
}
