# Database Seeding Scripts

This directory contains scripts for populating the database with Bible content and pSEO data.

## Quick Start

```bash
# 1. Seed Book table (66 books) - REQUIRED for routes to work
npm run seed:books

# 2. Check if books were seeded  successfully
npm run check:books

# 3. Seed pSEO content
npx tsx scripts/seed-situations.ts
npx tsx scripts/seed-professions.ts
npx tsx scripts/seed-names.ts

# 4. Ingest Bible verses (optional, for actual verse content)
npm run ingest:bible
```

## Production Deployment Checklist

When deploying to Vercel/production:

1. ✅ **Set environment variables** in Vercel dashboard:
   - `DATABASE_URL` - Supabase pooled connection (port 6543)
   - `DIRECT_URL` - Supabase direct connection (port 5432)

2. ✅ **Pull production env vars locally** (for seeding):
   ```bash
   vercel env pull .env.production.local --environment=production
   ```

3. ✅ **Seed Book table** (CRITICAL - routes fail without this):
   ```bash
   npm run seed:books
   ```
   This uses `DIRECT_URL` to bypass connection pooling issues.

4. ✅ **Seed pSEO content**:
   ```bash
   npx tsx scripts/seed-situations.ts
   npx tsx scripts/seed-professions.ts
   npx tsx scripts/seed-names.ts
   ```

5. ✅ **Verify deployment**:
   ```bash
   # Check diagnostic endpoint
   curl https://www.thelordwill.com/api/diagnose

   # Should show:
   # - books: 66
   # - situations: 10
   # - professions: 15
   # - names: 11
   ```

## Available Scripts

### Seeding Scripts

- **`seed-books-direct.ts`** - Seeds Book table (66 books)
  - Uses DIRECT_URL to avoid pgbouncer prepared statement conflicts
  - Run via: `npm run seed:books`
  - Required for all routes to work

- **`seed-situations.ts`** - Seeds 10 popular situations with verse mappings
  - anxiety, fear, hope, grief, strength, forgiveness, peace, love, patience, trust

- **`seed-professions.ts`** - Seeds 15 professions
  - teachers, nurses, engineers, doctors, business-leaders, etc.

- **`seed-names.ts`** - Seeds 11 biblical names
  - John, Mary, David, Sarah, Michael, Elizabeth, etc.

- **`seed-place-jerusalem.ts`** - Seeds Jerusalem place data

### Ingestion Scripts

- **`ingest-from-csv.ts`** - Main Bible ingestion (English translations)
  - Ingests from CSV files in `data/` directory
  - Run via: `npm run ingest:bible`

- **`ingest-multilang.ts`** - Multi-language Bible ingestion
  - Spanish (Reina Valera 1909)
  - Portuguese (Bíblia Livre)
  - Run via: `npm run ingest:multilang`
  - Uses batch SQL for performance (60-90x faster)

- **`ingest-strongs.ts`** - Strong's Concordance data
  - Original Hebrew/Greek word definitions
  - Run via: `npm run ingest:strongs`

### Diagnostic Scripts

- **`check-books.ts`** - Verify Book and Verse table counts
  - Run via: `npm run check:books`

- **`check-data.ts`** - Check all table counts

## Common Issues

### "prepared statement already exists" Error

**Problem**: Supabase uses pgbouncer for connection pooling, which caches prepared statements.

**Solution**: Use `DIRECT_URL` instead of `DATABASE_URL` for seeding operations.

All seeding scripts automatically use `DIRECT_URL` when available.

### Routes Return 404 Despite Data Existing

**Cause**: Missing Book table data. Situation/profession queries require Book table for verse relationships.

**Fix**:
```bash
npm run seed:books
```

### Slow Ingestion

The multi-language ingestion uses batch SQL updates (500 verses per query) for optimal performance:
- Old approach: ~62,000 individual queries = 2-3 hours
- New approach: ~124 batch queries = <2 minutes

## Database Schema Notes

### Core Tables

- **Book** (66 records) - Bible books metadata
- **Verse** (~31,000 records) - Bible verses in multiple translations
- **Situation** (10+ records) - Life situations with verse mappings
- **Profession** (15+ records) - Professional categories
- **Name** (11+ records) - Biblical names with etymology
- **Place** (1+ records) - Biblical locations

### Key Relationships

```
Situation → SituationVerseMapping → Verse → Book
Profession (no verse mappings yet)
Name → NameMention → Verse
Place → PlaceVerseMapping → Verse
```

## Testing Locally

```bash
# 1. Start dev server
npm run dev

# 2. Visit routes
# http://localhost:3000/bible-verses-for/anxiety
# http://localhost:3000/bible-verses-for/teachers
# http://localhost:3000/meaning-of-john-in-the-bible
# http://localhost:3000/bible-places/jerusalem
```

## Production URLs

After successful deployment and seeding:

- Home: https://www.thelordwill.com/
- Situations: https://www.thelordwill.com/bible-verses-for/anxiety
- Professions: https://www.thelordwill.com/bible-verses-for/teachers
- Names: https://www.thelordwill.com/meaning-of-john-in-the-bible
- Places: https://www.thelordwill.com/bible-places/jerusalem
- Diagnostics: https://www.thelordwill.com/api/diagnose
