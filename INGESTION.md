# Bible Data Ingestion Guide

Complete guide for ingesting Bible data into the database.

## Prerequisites

1. **PostgreSQL Database**
   - Version 12+
   - Connection URL configured in `.env`

2. **Node.js & Dependencies**
   ```bash
   npm install
   ```

3. **Prisma Setup**
   ```bash
   npm run db:generate
   npm run db:push
   ```

## Overview

The ingestion process consists of two main scripts:

1. **ingest-bible-data.ts** - Fetches and stores Bible verses
2. **ingest-strongs.ts** - Maps Strong's Concordance numbers

## Script 1: Bible Data Ingestion

### What It Does

- Seeds the `Book` table with 66 books
- Fetches verses from Bolls Life API
- Ingests 5 English translations:
  - KJV (King James Version)
  - WEB (World English Bible)
  - ASV (American Standard Version)
  - BBE (Bible in Basic English)
  - YLT (Young's Literal Translation)
- Creates `IngestionLog` records for tracking

### Running the Script

```bash
npm run ingest:bible
```

### Expected Duration

- **Full ingestion**: 30-60 minutes
- **Per translation**: ~6-12 minutes
- **Per book**: ~10-30 seconds

### Output Example

```
🚀 Starting Bible data ingestion...

📚 Seeding books table...
✅ Seeded 66 books

📖 Ingesting KJV translation...
  Processing Genesis (50 chapters)...
    ✓ Processed 10/50 chapters
    ✓ Processed 20/50 chapters
    ...
  ✅ Completed Genesis
  ...

📊 KJV Summary:
   Books processed: 66
   Verses created: 31102
   Verses updated: 0
   Verses failed: 0

✅ Ingestion completed successfully!

📊 Final Statistics:
   Translations completed: 5/5
   Total verses created: 31102
   Total verses updated: 124408
   Total verses failed: 0
   Duration: 1834s
```

### Rate Limiting

The script includes automatic rate limiting:
- 100ms delay between chapters
- Prevents API throttling
- Configurable in script

### Error Handling

- Failed verses are logged but don't stop ingestion
- Each translation tracked independently
- Resume-friendly (updates existing verses)

### Resuming Failed Ingestion

If ingestion fails, simply re-run:

```bash
npm run ingest:bible
```

The script uses `upsert` operations:
- Existing verses are updated
- Missing verses are created
- No duplicates

## Script 2: Strong's Numbers Ingestion

### What It Does

- Seeds `StrongsLexicon` table
- Creates verse-to-Strong's mappings
- Initializes verse popularity tracking
- Focuses on top 1,000 most searched verses

### Running the Script

```bash
npm run ingest:strongs
```

### Expected Duration

- **Sample data**: < 1 minute
- **Full dataset**: Varies by source

### Output Example

```
🚀 Starting Strong's Numbers ingestion...

⚠️  NOTE: This is using sample data.

📖 Seeding Strong's Lexicon...
✅ Seeded 10 Strong's entries

🔗 Creating verse-to-Strong's mappings...
✅ Created 6 verse-to-Strong's mappings

📊 Initializing verse popularity tracking...
✅ Initialized popularity tracking for 20 verses

✅ Strong's ingestion completed!

📊 Statistics:
   Strong's entries created: 10
   Verse mappings created: 6
   Errors: 0
   Duration: 2s
```

### Important Notes

The current script uses **sample data**. For production:

1. **Complete Strong's Dataset**
   - Import from: [Open Scriptures](https://github.com/openscriptures/strongs)
   - Or: [Blue Letter Bible](https://www.blueletterbible.org/)

2. **Interlinear Bible Data**
   - Parse word-level mappings
   - Sources: OSIS XML, SWORD modules

3. **Actual Verse Popularity**
   - Use analytics data
   - Track search and view counts

## Running Both Scripts

```bash
npm run ingest:all
```

This runs:
1. Bible data ingestion
2. Strong's numbers ingestion

## Monitoring Progress

### 1. Console Output

Real-time progress in terminal:
- Books processed
- Chapters completed
- Verses created/updated
- Errors encountered

### 2. Database Logs

Query ingestion logs:

```sql
-- View all logs
SELECT * FROM "IngestionLog" ORDER BY "startedAt" DESC;

-- View completed operations
SELECT * FROM "IngestionLog"
WHERE status = 'completed'
ORDER BY "startedAt" DESC;

-- View failed operations
SELECT * FROM "IngestionLog"
WHERE status = 'failed';
```

### 3. Prisma Studio

Visual database browser:

```bash
npm run db:studio
```

Navigate to `http://localhost:5555`

## Verification

### Check Verse Count

```sql
-- Total verses
SELECT COUNT(*) FROM "Verse";
-- Expected: ~31,102

-- Verses with KJV text
SELECT COUNT(*) FROM "Verse" WHERE "textKjv" IS NOT NULL;

-- Verses per book
SELECT b.name, COUNT(v.id) as verse_count
FROM "Book" b
LEFT JOIN "Verse" v ON b.id = v."bookId"
GROUP BY b.id, b.name
ORDER BY b.id;
```

### Check Strong's Mappings

```sql
-- Total Strong's entries
SELECT COUNT(*) FROM "StrongsLexicon";

-- Verse-Strong mappings
SELECT COUNT(*) FROM "VerseStrong";

-- Most common Strong's numbers
SELECT s."strongsId", s."originalWord", s.occurrences
FROM "StrongsLexicon" s
ORDER BY s.occurrences DESC
LIMIT 10;
```

### Check Books

```sql
-- All books
SELECT * FROM "Book" ORDER BY id;

-- Books by testament
SELECT testament, COUNT(*)
FROM "Book"
GROUP BY testament;
```

## Troubleshooting

### Issue: API Connection Failed

**Error:**
```
❌ Failed to fetch Genesis 1: Connection timeout
```

**Solutions:**
1. Check internet connection
2. Verify Bolls API is accessible: https://bolls.life/api/
3. Increase timeout in script
4. Check firewall settings

### Issue: Database Connection Error

**Error:**
```
PrismaClientInitializationError: Can't reach database
```

**Solutions:**
1. Verify PostgreSQL is running
2. Check `DATABASE_URL` in `.env`
3. Test connection: `psql $DATABASE_URL`
4. Check database exists

### Issue: Out of Memory

**Error:**
```
JavaScript heap out of memory
```

**Solutions:**
1. Increase Node.js memory:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm run ingest:bible
   ```

2. Process fewer translations at once
3. Modify script to process books sequentially

### Issue: Duplicate Key Error

**Error:**
```
Unique constraint failed on the fields: (`id`)
```

**Cause:** Verse already exists

**Solution:** This is expected - script uses upsert. If persistent:
```bash
# Reset and re-run
npm run db:push --force-reset
npm run ingest:bible
```

### Issue: Rate Limiting

**Error:**
```
❌ Failed to fetch: 429 Too Many Requests
```

**Solutions:**
1. Increase delay in script (currently 100ms)
2. Run during off-peak hours
3. Contact API provider for rate limit increase

## Advanced Configuration

### Custom Delay Between Requests

Edit `scripts/ingest-bible-data.ts`:

```typescript
// Change from 100ms to 200ms
await new Promise(resolve => setTimeout(resolve, 200));
```

### Ingest Specific Books Only

```typescript
// Filter books
const booksToIngest = BIBLE_BOOKS.filter(book =>
  book.testament === 'NT' // Only New Testament
);
```

### Ingest Specific Translation

```typescript
// Only KJV
const TRANSLATIONS = [
  { id: 'kjv', field: 'textKjv' },
];
```

### Skip Already Ingested Books

Add tracking:

```typescript
const processedBooks = new Set<number>();

// Before processing
if (processedBooks.has(book.id)) {
  console.log(`Skipping ${book.name} (already processed)`);
  continue;
}
```

## Data Sources

### Primary: Bolls Life API

**URL:** https://bolls.life/api/

**Endpoints Used:**
- `/get-translations/` - List translations
- `/get-books/{translation}/` - List books
- `/get-chapter/{translation}/{book}/{chapter}/` - Get chapter

**Rate Limits:**
- Not officially documented
- Conservative: 10 requests/second
- Our script: ~10 requests/second (100ms delay)

**Advantages:**
- Free, no API key required
- Multiple translations
- Well-structured JSON
- Reliable uptime

### Alternative: Bible API

If Bolls API is unavailable, consider:

1. **API.Bible** (https://scripture.api.bible/)
   - Requires API key (free tier available)
   - Modern REST API
   - 1000 requests/day free

2. **ESV API** (https://api.esv.org/)
   - Free for non-commercial
   - ESV translation only
   - Requires API key

3. **Bible Gateway API**
   - Commercial license required
   - Multiple translations
   - Enterprise-grade

## Future Enhancements

### 1. Incremental Updates

Track last update timestamp:

```prisma
model Verse {
  // ...
  lastSynced DateTime?
}
```

Only fetch verses modified since last sync.

### 2. Parallel Processing

Process multiple books simultaneously:

```typescript
await Promise.all(
  BIBLE_BOOKS.map(book => processBook(book))
);
```

Use with caution - respects rate limits.

### 3. Caching

Cache API responses locally:

```typescript
const cache = new Map<string, BollsVerse[]>();

async function getCachedChapter(translation, book, chapter) {
  const key = `${translation}:${book}:${chapter}`;
  if (cache.has(key)) return cache.get(key);

  const data = await getChapter(translation, book, chapter);
  cache.set(key, data);
  return data;
}
```

### 4. Progress Resume

Save progress to database:

```prisma
model IngestionProgress {
  id              String @id @default(cuid())
  translation     String
  lastBookId      Int
  lastChapter     Int
  lastUpdated     DateTime
}
```

Resume from last completed chapter.

### 5. Webhook Notifications

Notify when ingestion completes:

```typescript
await fetch('https://hooks.slack.com/...', {
  method: 'POST',
  body: JSON.stringify({
    text: `Bible ingestion completed! ${stats.versesCreated} verses created.`
  })
});
```

## Support

### Need Help?

1. Check [DATABASE.md](DATABASE.md) for schema details
2. Review [ARCHITECTURE.md](ARCHITECTURE.md) for system design
3. Check ingestion logs in database
4. Search existing GitHub issues

### Reporting Issues

Include:
1. Script output/error message
2. Node.js version: `node --version`
3. PostgreSQL version: `psql --version`
4. Database state (verse count, etc.)
5. Steps to reproduce

---

**Last Updated:** 2026-01-05
**Scripts Version:** 1.0
