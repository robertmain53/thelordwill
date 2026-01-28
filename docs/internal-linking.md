# Internal Linking System

This document describes the internal linking architecture that ensures all public pages are reachable from the homepage within 3 clicks.

## Graph Definition

The site's navigation structure forms a directed graph where:
- **Nodes** = Public pages (URLs)
- **Edges** = Internal links (anchor tags with href pointing to internal paths)

### Click Depth

**Click depth** is the shortest path length from the homepage (`/`) to any given page.

| Depth | Example Path |
|-------|-------------|
| 0 | `/` (homepage) |
| 1 | `/` → `/prayer-points` |
| 2 | `/` → `/prayer-points` → `/prayer-points/healing` |
| 3 | `/` → `/prayer-points` → `/prayer-points/healing` → related page |

## Depth Rule

**All public pages must have click depth ≤ 3.**

This means every page should be reachable within 3 clicks from the homepage.

## Architecture

### Hub Pages (Depth 1)

These pages are linked directly from the homepage:
- `/prayer-points` - Prayer Points listing
- `/bible-places` - Biblical Places listing
- `/bible-travel` - Travel Itineraries listing
- `/situations` - Situations (Bible verses for life moments)
- `/professions` - Professions listing
- `/names` - Biblical Names listing

### Detail Pages (Depth 2)

Detail pages are linked from their hub pages:
- `/prayer-points/[slug]` - Individual prayer point
- `/bible-places/[slug]` - Individual place
- `/bible-travel/[slug]` - Individual itinerary
- `/bible-verses-for/[slug]` - Situation or profession detail
- `/meaning-of/[slug]/in-the-bible` - Name meaning

### Cross-Links (Depth 3 Prevention)

To prevent pages from exceeding depth 3, each detail page includes:
1. **Hub Bar** - Links back to homepage and parent hub
2. **Siblings Block** - Links to related items in the same category
3. **Cross-Entity Block** - Links to related content from other entity types

## Components

### RelatedSection

Displays related links on detail pages.

```tsx
import { RelatedSection } from "@/components/related-section";

<RelatedSection title="Related Content" links={relatedLinks} />
```

### ExploreMore

Displays links to other hub sections on listing pages.

```tsx
import { ExploreMore } from "@/components/related-section";

<ExploreMore currentSection="/prayer-points" hubs={getHubLinks()} />
```

### Breadcrumbs

Navigation breadcrumbs for detail pages.

```tsx
import { Breadcrumbs } from "@/components/breadcrumbs";

<Breadcrumbs items={[
  { label: "Home", href: "/", position: 1 },
  { label: "Prayer Points", href: "/prayer-points", position: 2 },
  { label: "Healing", href: "/prayer-points/healing", position: 3 },
]} />
```

## Internal Linking Helpers

### `lib/internal-linking/index.ts`

Main module with functions for:
- `getHubLinks()` - Returns hub page links for homepage
- `getRelatedLinks(entityType, record)` - Returns related links for a detail page
- `generateBreadcrumbs(entityType, title, slug)` - Generates breadcrumb navigation
- Category filters and popular item fetchers

### `lib/internal-linking/route-registry.ts`

Route enumeration for QA:
- `getStaticPublicRoutes()` - Returns static page routes
- `isExcludedRoute(path)` - Checks if route should be excluded from analysis
- `extractInternalLinks(html)` - Extracts links from HTML
- `computeDepths(graph, source)` - BFS depth calculation

## QA Script

### Running Locally

```bash
# With existing dev server
QA_BASE_URL=http://localhost:3000 npm run qa:click-depth

# Build and run (starts server on port 3010)
npm run qa:click-depth
```

### What It Does

1. **Discovers Routes** - Queries DB for all published entities
2. **Fetches Pages** - Actually fetches each page's HTML
3. **Extracts Links** - Parses href attributes from anchor tags
4. **Builds Graph** - Creates directed graph of navigation
5. **Computes Depths** - BFS from homepage to find shortest paths
6. **Validates** - Fails if any page has depth > 3 or is unreachable

### Example Output

**PASS:**
```
Click Depth QA Validation
Max allowed depth: 3 clicks from homepage

[INFO] Server ready at http://localhost:3010
[INFO] Total routes to check: 156

Depth distribution:
  Depth 0: 1 pages
  Depth 1: 7 pages
  Depth 2: 148 pages

SUMMARY
  Total routes:        156
  Reachable:           156
  Within 3 clicks:     156
  Violations:          0
  Unreachable:         0

CLICK DEPTH QA PASSED
```

**FAIL:**
```
Click Depth QA Validation
Max allowed depth: 3 clicks from homepage

=== VIOLATIONS (2 pages exceed max depth) ===

URL: /meaning-of/obscure-name/in-the-bible
  Depth: 4 (max: 3)
  Path: / -> /names -> ... -> /meaning-of/obscure-name/in-the-bible

=== UNREACHABLE (1 pages not linked) ===
  /prayer-points/orphan-page

CLICK DEPTH QA FAILED
```

## Fixing Violations

### Page Exceeds Max Depth

1. **Add to hub page** - Ensure the page is linked from its hub listing
2. **Add cross-links** - Add links from related pages at depth ≤ 2
3. **Add to homepage** - For critical pages, add direct links from homepage

### Page is Unreachable

1. **Check hub page** - Ensure entity appears in its hub's listing query
2. **Check status** - Ensure entity is published (status = "published")
3. **Add manual links** - Add the page to a featured/popular section

## Determinism

All linking is deterministic:
- **No randomization** - Links are always in the same order
- **Stable ordering** - Queries use explicit `orderBy` clauses
- **Consistent output** - Same DB state = same graph

Ordering rules:
1. Priority (desc) where applicable
2. Updated date (desc) for recency
3. Slug/title (asc) for alphabetical tiebreaker

## Adding New Entity Types

1. Add routes to `getStaticPublicRoutes()` if hub page exists
2. Add DB query in `qa-click-depth.mjs` route discovery
3. Add pattern to `ROUTE_PATTERNS` in route-registry
4. Add `getRelatedLinksFor*` function in internal-linking
5. Update hub and detail pages with appropriate link blocks
