# Production Deployment Fixes

This document summarizes all fixes applied to get the production site working on Vercel.

## Issues Encountered

### 1. Database Connection Failures (CRITICAL)
**Error:** `prepared statement 's0' already exists` (PostgreSQL error code 42P05)

**Root Cause:** Supabase uses pgbouncer for connection pooling, which caches prepared statements. Prisma was creating new client instances and trying to recreate existing prepared statements.

**Solution:** Configure Prisma client to add `?pgbouncer=true` parameter to pooled connections.

**Files Changed:**
- [lib/db/prisma.ts](lib/db/prisma.ts#L7-L18)

```typescript
// Add pgbouncer parameter to connection string for pooled connections
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;

  // Add pgbouncer=true parameter if using Supabase pooler
  if (url.includes('pooler.supabase.com') && !url.includes('pgbouncer=true')) {
    const separator = url.includes('?') ? '&' : '?';
    return url + separator + 'pgbouncer=true';
  }
  return url;
};

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
```

### 2. Invalid Next.js Route Structure
**Error:** All `/bible-verses-for/*` and `/meaning-of/*` routes returning 404

**Root Cause:** Incorrect folder naming:
- Used `bible-verses-for-[slug]` instead of `bible-verses-for/[slug]`
- URLs used dash format `/bible-verses-for-anxiety` instead of slash format

**Solution:** Fixed route structure and updated all URL references.

**Files Changed:**
- Moved `app/bible-verses-for-[slug]/` → `app/bible-verses-for/[slug]/`
- Updated all canonical URLs in metadata
- Fixed internal linking URLs in [lib/seo/internal-linking.ts](lib/seo/internal-linking.ts)
- Fixed sitemap URLs in [lib/seo/sitemap-generator.ts](lib/seo/sitemap-generator.ts)

### 3. Client/Server Boundary Issue (CRITICAL)
**Error:** `Attempted to call prepareTranslations() from the server but prepareTranslations is on the client`

**Root Cause:** `prepareTranslations()` was exported from `components/translation-comparison.tsx`, which has `'use client'` directive. Server components cannot call client component functions in React Server Components.

**Solution:** Created server-safe utility file and updated imports.

**Files Changed:**
- **Created:** [lib/translations.ts](lib/translations.ts) - Server-side translation utilities
- **Updated:** [components/translation-comparison.tsx](components/translation-comparison.tsx) - Re-exports from lib
- **Updated:** [app/bible-verses-for/[slug]/page.tsx](app/bible-verses-for/[slug]/page.tsx) - Import from lib/translations

```typescript
// lib/translations.ts - Can be used on both server and client
export function prepareTranslations(verse: { ... }): Translation[] { ... }

// components/translation-comparison.tsx - Re-export for backwards compatibility
export { prepareTranslations } from '@/lib/translations';

// Server component - Import from lib instead of component
import { prepareTranslations } from "@/lib/translations";
```

### 4. TypeScript Build Errors
**Error:** TypeScript lint errors preventing deployment

**Issues:**
- Using `any` type in diagnostic endpoint
- Missing type guards for union types (`number | string`)

**Solution:** Added proper TypeScript interfaces and type guards.

**Files Changed:**
- [app/api/diagnose/route.ts](app/api/diagnose/route.ts)

### 5. Missing Book Table Data
**Error:** Routes failing even after database connection worked

**Root Cause:** Book table was empty, causing queries with book relations to fail.

**Solution:** Created direct seeding script that bypasses pgbouncer.

**Files Changed:**
- [scripts/seed-books-direct.ts](scripts/seed-books-direct.ts) - Uses DIRECT_URL
- [package.json](package.json) - Updated `seed:books` script

## Deployment Checklist

### ✅ Environment Variables (Vercel Dashboard)
- `DATABASE_URL` - Supabase pooled connection (port 6543)
- `DIRECT_URL` - Supabase direct connection (port 5432)

### ✅ Database Seeding (Run Locally)
```bash
# Pull production environment variables
vercel env pull .env.production.local --environment=production

# Seed Book table (REQUIRED - routes fail without this)
npm run seed:books

# Seed pSEO content
npx tsx scripts/seed-situations.ts
npx tsx scripts/seed-professions.ts
npx tsx scripts/seed-names.ts
```

### ✅ Verification
```bash
# Check diagnostic endpoint
curl https://www.thelordwill.com/api/diagnose

# Expected output:
# {
#   "database": {
#     "connected": true,
#     "tables": {
#       "books": 66,
#       "verses": 31102,
#       "situations": 10,
#       "professions": 15,
#       "names": 11
#     }
#   },
#   "errors": []
# }
```

### ✅ Test Routes
- https://thelordwill.com/bible-verses-for/anxiety ✓
- https://thelordwill.com/bible-verses-for/teachers ✓
- https://thelordwill.com/bible-verses-for/fear ✓
- https://www.thelordwill.com/meaning-of/john/in-the-bible ✓

## Key Learnings

1. **Supabase pgbouncer:** Always use `?pgbouncer=true` with pooled connections or use `DIRECT_URL` for operations that need prepared statements.

2. **Next.js 15 App Router:** Dynamic routes require proper folder structure: `[param]` not `[param]-`

3. **React Server Components:** Functions exported from `'use client'` components cannot be called in server components. Use separate utility files for shared functions.

4. **Next.js Route Matching:** URLs must match the folder structure exactly:
   - Folder: `app/bible-verses-for/[slug]/`
   - URL: `/bible-verses-for/anxiety` (with slash)

5. **TypeScript in Production:** Next.js enforces strict TypeScript checking in builds, even if local dev allows it.

## Files Modified Summary

### Core Fixes
- `lib/db/prisma.ts` - pgbouncer configuration
- `lib/translations.ts` - Server-safe utilities (NEW)
- `components/translation-comparison.tsx` - Re-export prepareTranslations

### Route Structure
- `app/bible-verses-for/[slug]/page.tsx` - Fixed imports and structure
- `app/meaning-of/[name]/in-the-bible/page.tsx` - Fixed canonical URLs

### SEO & Linking
- `lib/seo/internal-linking.ts` - Fixed URL formats
- `lib/seo/sitemap-generator.ts` - Fixed sitemap URLs

### Database
- `scripts/seed-books-direct.ts` - Direct connection seeding (NEW)
- `scripts/README.md` - Comprehensive documentation (NEW)
- `app/api/diagnose/route.ts` - Production diagnostics (NEW)

### Configuration
- `package.json` - Updated seed:books script

## Final Status

✅ **All production routes working**
✅ **Database connection stable**
✅ **SEO URLs correct**
✅ **Build passing**
✅ **Type checking passing**

## Commits Applied

```
d8f06e5 Clean up test and debug pages
c53ccfc Fix client/server boundary issue with prepareTranslations
b9fa21b Add progressive rendering test
2d47f54 Add test page with full JSX but no metadata
b08c967 Fix React key placement in verse mapping
d2ee62f Fix sitemap URL formats for all route types
0bcb28f Fix URL format across all routes and internal links
e712a6f Fix pgbouncer prepared statement conflicts in production
7d4be8e Add type guards for table count comparisons
7e0a850 Fix TypeScript lint error in diagnostic endpoint
```

## Next Steps

1. Monitor Vercel logs for any remaining issues
2. Set up proper error tracking (Sentry, LogRocket, etc.)
3. Configure LLM API key for content generation
4. Implement Strong's numbers ingestion
5. Add remaining pSEO content (more situations, professions, names)

---

**Date:** 2026-01-10
**Environment:** Production (Vercel)
**Database:** Supabase (PostgreSQL with pgbouncer)
**Framework:** Next.js 15 (App Router)
