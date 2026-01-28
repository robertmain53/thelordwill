# Category Labels System

Centralized category label mapping for consistent UI display across the application.

## Overview

- **DB stores**: Category slugs (stable keys like `peace-over-fear`)
- **UI displays**: Human-friendly labels (like "Peace Over Fear")
- **Unknown slugs**: Fall back to Title Case conversion
- **Grouping**: Always by slug (stable even if labels change)
- **Sorting**: By order, then by label alphabetically

## Module Location

`lib/content/category-labels.ts`

## Key Functions

### `normalizeCategorySlug(input)`

Normalizes any category input to a consistent slug format.

```typescript
normalizeCategorySlug("Peace Over Fear") // "peace-over-fear"
normalizeCategorySlug("  HEALING  ")     // "healing"
normalizeCategorySlug(null)              // "other"
normalizeCategorySlug("")                // "other"
```

### `getCategoryLabel(slug)`

Gets the display label for a category slug.

```typescript
getCategoryLabel("breakthrough")   // "Breakthrough"
getCategoryLabel("peace-over-fear") // "Peace Over Fear"
getCategoryLabel("weird-custom")   // "Weird Custom" (Title Case fallback)
getCategoryLabel(null)             // "Other"
```

### `getCategoryOrder(slug)`

Gets the sort order for a category slug. Unknown categories get order 900.

```typescript
getCategoryOrder("breakthrough") // 10
getCategoryOrder("healing")      // 20
getCategoryOrder("unknown")      // 900
getCategoryOrder("other")        // 999
```

### `groupByCategorySlug(items, getSlug)`

Groups items by category slug with stable output ordering.

```typescript
const groups = groupByCategorySlug(prayerPoints, (p) => p.category);
// Returns: [
//   { slug: "breakthrough", label: "Breakthrough", order: 10, items: [...] },
//   { slug: "healing", label: "Healing", order: 20, items: [...] },
// ]
```

### `groupByCategorySlugWithDbLabels(items, getSlug, dbLabels)`

Groups items using DB labels merged with static fallbacks. Use this when you have fetched TaxonomyLabel records.

```typescript
const dbLabels = await prisma.taxonomyLabel.findMany({
  where: { scope: "prayerPointCategory", key: { in: slugs } },
  select: { key: true, label: true, sortOrder: true },
});

const groups = groupByCategorySlugWithDbLabels(
  prayerPoints,
  (p) => p.category,
  dbLabels
);
```

### `formatCategoryForAdmin(slug)`

Formats category display for admin lists (label + slug for debugging).

```typescript
formatCategoryForAdmin("peace-over-fear")
// { label: "Peace Over Fear", slug: "peace-over-fear" }
```

## Static Category Labels

Known categories with labels and sort orders are defined in `CATEGORY_LABELS`:

### Prayer Point Categories
| Slug | Label | Order |
|------|-------|-------|
| breakthrough | Breakthrough | 10 |
| healing | Healing | 20 |
| protection | Protection | 30 |
| peace-over-fear | Peace Over Fear | 40 |
| deliverance | Deliverance | 50 |
| provision | Provision | 60 |
| family | Family | 70 |
| encouragement | Encouragement | 80 |
| guidance | Guidance | 85 |
| faith | Faith | 90 |
| forgiveness | Forgiveness | 95 |
| gratitude | Gratitude | 100 |
| strength | Strength | 105 |
| wisdom | Wisdom | 110 |

### Situation Categories
| Slug | Label | Order |
|------|-------|-------|
| relationships | Relationships | 10 |
| work-career | Work & Career | 20 |
| health | Health | 30 |
| finances | Finances | 40 |
| spiritual-growth | Spiritual Growth | 50 |
| grief-loss | Grief & Loss | 60 |
| anxiety | Anxiety | 70 |
| depression | Depression | 75 |
| addiction | Addiction | 80 |
| parenting | Parenting | 85 |
| marriage | Marriage | 90 |

## Adding New Categories

1. Add entry to `CATEGORY_LABELS` in `lib/content/category-labels.ts`:
   ```typescript
   "new-category": { label: "New Category", order: 115 },
   ```

2. Optionally add to `TaxonomyLabel` table for DB-driven config (overrides static)

## Usage in Pages

### Public Listing Pages

```typescript
import { groupByCategorySlugWithDbLabels, normalizeCategorySlug } from "@/lib/content/category-labels";

// Fetch items
const items = await prisma.prayerPoint.findMany({ ... });

// Get distinct slugs
const slugs = Array.from(new Set(items.map((p) => normalizeCategorySlug(p.category))));

// Fetch DB labels (optional, for overrides)
const dbLabels = await prisma.taxonomyLabel.findMany({
  where: { scope: "prayerPointCategory", key: { in: slugs } },
  select: { key: true, label: true, sortOrder: true },
});

// Group with merged labels
const categories = groupByCategorySlugWithDbLabels(items, (p) => p.category, dbLabels);

// Render
{categories.map((c) => (
  <section key={c.slug}>
    <h2>{c.label}</h2>  {/* Shows human-friendly label */}
    {c.items.map(...)}
  </section>
))}
```

### Admin Pages

```typescript
import { formatCategoryForAdmin } from "@/lib/content/category-labels";

// In table cell
const cat = formatCategoryForAdmin(item.category);
// Display: cat.label (cat.slug shown on hover or in parentheses)
```

## Label Resolution Order

1. DB TaxonomyLabel record (if exists and active)
2. Static `CATEGORY_LABELS` mapping
3. Title Case conversion of slug (fallback)
