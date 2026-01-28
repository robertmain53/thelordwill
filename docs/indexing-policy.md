# Indexing Policy

This document defines the explicit rules for search engine indexing across the site.

## Policy Rules

### 1. Admin Routes

**Rule:** All `/admin/**` routes must be `noindex, nofollow`.

**Implementation:**
- Middleware adds `X-Robots-Tag: noindex, nofollow` header to all admin responses
- This includes `/admin/login` and all authenticated admin pages
- Header is set regardless of authentication status

**Rationale:**
- Admin pages contain no user-facing content
- Prevents search engines from indexing login forms
- Reduces crawl budget waste

### 2. Draft Content

**Rule:** Draft content returns HTTP 404 (not just noindex).

**Implementation:**
- All entity detail pages use `status: "published"` filter in DB queries
- If record not found OR status !== "published", page calls `notFound()`
- This applies to:
  - Prayer Points (`/prayer-points/[slug]`)
  - Places (`/bible-places/[slug]`)
  - Situations (`/bible-verses-for/[slug]`)
  - Professions (via `/bible-verses-for/[slug]` fallback)

**Rationale:**
- 404 is cleaner than noindex for unpublished content
- Prevents any possibility of draft content leaking
- Fail-closed security: unknown status = not found

### 3. ES/PT Fallback Pages

**Rule:** If a non-English locale serves English content (missing translation), it should be `noindex, follow` with canonical pointing to English version.

**Implementation:**
- `lib/seo/indexing-policy.ts` provides `isFallbackTranslation()` heuristic
- Detection based on:
  - Content is >=70% ASCII words
  - Content has <3 stopwords from target language (Spanish/Portuguese)
- When fallback detected:
  - Add `<meta name="robots" content="noindex, follow">`
  - Set canonical to EN version

**Rationale:**
- Prevents duplicate content penalties
- Maintains link equity flow to English content
- Allows crawling to discover real translations

### 4. Canonical URLs

**Rule:** All public pages must have absolute canonical URLs.

**Implementation:**
- Use `getCanonicalUrl()` from `lib/utils` for all canonical generation
- Canonical must include protocol and domain
- No relative canonicals allowed

**Rationale:**
- Absolute canonicals are unambiguous
- Required by Google's guidelines
- Prevents issues with protocol mismatch

## Module Reference

### `lib/seo/indexing-policy.ts`

Core helper functions for indexing decisions:

```typescript
// Check if path is admin route
isAdminRoute(pathname: string): boolean

// Detect fallback translation using heuristic
isFallbackTranslation({
  locale: string,
  content: string,
  metaDescription?: string
}): boolean

// Get robots meta for any page
robotsMetaForPage({
  pathname: string,
  locale?: string,
  content?: string,
  metaDescription?: string
}): { metaRobots?: string; xRobotsTag?: string }

// Get canonical URL for fallback pages
canonicalForFallback({
  path: string,
  fallbackLocale?: string
}): string

// Get appropriate canonical for any page
getCanonicalForPage({
  pathname: string,
  locale?: string,
  content?: string,
  metaDescription?: string
}): string
```

### Fallback Detection Heuristic

The heuristic in `isFallbackTranslation()` works as follows:

1. Only applies to non-EN locales (es, pt)
2. Analyzes combined content + metaDescription
3. Calculates ASCII word ratio (words containing only a-z, 0-9, hyphens, apostrophes)
4. Counts target language stopwords
5. Returns `true` (fallback) if:
   - ASCII ratio >= 70% AND
   - Stopword count < 3

**Stopwords checked:**
- Spanish: el, la, los, las, un, una, de, del, al, y, o, en, que, es, para, por, con, como, pero, se, su, sus, etc.
- Portuguese: o, a, os, as, um, uma, de, do, da, dos, das, em, no, na, e, ou, que, para, por, com, como, mas, se, etc.

## QA Script

### Usage

```bash
# Run with existing server
QA_BASE_URL=http://localhost:3000 npm run qa:indexing

# Build and run (starts server on port 3010)
npm run qa:indexing
```

### What It Tests

1. **Admin Routes**
   - Fetches `/admin` and `/admin/login`
   - Verifies `X-Robots-Tag: noindex, nofollow` header present

2. **Public Pages**
   - Fetches listing pages (`/en`, `/en/prayer-points`, etc.)
   - Verifies canonical URLs are present and absolute

3. **Draft Content**
   - Queries database for draft records
   - Fetches their public URLs
   - Verifies HTTP 404 response
   - Skips gracefully if no draft records exist

4. **Published Content**
   - Queries database for published records
   - Fetches their public URLs
   - Verifies HTTP 200 response
   - Verifies canonical URL is present and absolute

### Exit Codes

- `0` - All validations passed
- `1` - One or more validations failed

### SKIP Behavior

If no draft records exist in the database, the script outputs:
```
  Draft Prayer Point              SKIP - No draft record available
```

This is deterministic and does not cause test failure.

## Robots.txt

The site's `robots.txt` should complement this policy:

```
User-agent: *
Disallow: /admin/
Disallow: /api/
```

Note: `robots.txt` is advisory; `X-Robots-Tag` headers provide authoritative directives.

## Testing Manually

### Check Admin Headers

```bash
curl -I http://localhost:3000/admin/login | grep -i x-robots
# Should output: x-robots-tag: noindex, nofollow
```

### Check Draft Returns 404

```bash
# First, find a draft slug
# Then:
curl -o /dev/null -s -w "%{http_code}" http://localhost:3000/prayer-points/draft-slug
# Should output: 404
```

### Check Canonical is Absolute

```bash
curl -s http://localhost:3000/en/prayer-points | grep -i canonical
# Should contain: href="https://thelordwill.com/en/prayer-points"
```
