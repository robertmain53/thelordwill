# CSV Bible Data Ingestion Guide

Fast, reliable Bible data ingestion using public domain CSV files from ScrollMapper.

## Why CSV Instead of API?

| Feature | CSV Import | API (bible-api.com) |
|---------|-----------|---------------------|
| **Speed** | 5-10 minutes | 3-4 hours |
| **Reliability** | No rate limits | 429 errors |
| **Translations** | 5 (KJV, WEB, ASV, BBE, YLT) | 1 (WEB only) |
| **Commercial Use** | ✅ Public domain | ✅ WEB only |
| **Network Required** | Only for download | Entire process |

## Quick Start

### 1. Run the Ingestion

```bash
npm run ingest:bible
```

This will:
1. ✅ Download 5 CSV files from GitHub (~25 MB total)
2. ✅ Seed 66 books in database
3. ✅ Import ~155,000 verses (5 translations)
4. ✅ Complete in 5-10 minutes

### 2. Verify the Data

```bash
npm run db:studio
```

Check the `Verse` table - you should see ~31,000 records with all 5 translation columns populated.

## Translations Included

All are **public domain** - safe for commercial use:

1. **KJV (King James Version, 1611)**
   - Field: `textKjv`
   - Classic English, poetic language
   - Most widely quoted

2. **WEB (World English Bible, 2000)**
   - Field: `textWeb`
   - Modern English, easy to read
   - Based on ASV, public domain

3. **ASV (American Standard Version, 1901)**
   - Field: `textAsv`
   - Scholarly, literal translation
   - High accuracy

4. **BBE (Bible in Basic English, 1965)**
   - Field: `textBbe`
   - Simple vocabulary (850 words)
   - Great for ESL readers

5. **YLT (Young's Literal Translation, 1898)**
   - Field: `textYlt`
   - Preserves Hebrew/Greek grammar
   - Useful for word studies

## Data Source

**ScrollMapper Bible Databases**
- GitHub: https://github.com/scrollmapper/bible_databases
- License: Public Domain
- Format: CSV (id, book, chapter, verse, text)
- Coverage: 66 books, 31,102 verses per translation

## CSV File Format

```csv
Book,Chapter,Verse,Text
Genesis,1,1,"In the beginning God created the heaven and the earth."
Genesis,1,2,"And the earth was without form, and void..."
```

Fields:
- `Book`: Book name (e.g., "Genesis", "Exodus", "Matthew")
- `Chapter`: Chapter number
- `Verse`: Verse number
- `Text`: Verse text

## How It Works

### Download Phase
1. Creates `data/csv/` directory
2. Downloads CSV files from GitHub
3. Verifies file size (skips if already downloaded)

### Parsing Phase
1. Reads CSV line by line
2. Handles quoted text with escaped quotes
3. Extracts book name, chapter, verse, text
4. Maps book names to book IDs using BIBLE_BOOKS metadata

### Import Phase
1. Seeds books table (if not exists)
2. Batch imports 1,000 verses at a time
3. Uses `upsert` to update existing verses
4. Calculates word count for each verse
5. Logs progress every 5,000 verses

### Database Structure

Each verse is stored with our 8-digit ID format:
```typescript
{
  id: 1001001, // BBCCCVVV: Genesis 1:1
  bookId: 1,
  chapter: 1,
  verseNumber: 1,
  textKjv: "In the beginning God created...",
  textWeb: "In the beginning, God created...",
  textAsv: "In the beginning God created...",
  textBbe: "At the first God made...",
  textYlt: "In the beginning of God's preparing...",
  wordsCount: 10,
  createdAt: "2026-01-05T...",
  updatedAt: "2026-01-05T..."
}
```

## Performance

**Benchmarks:**
- Download: ~30 seconds (25 MB)
- Parse: ~10 seconds per file
- Import: ~2-3 minutes per translation (31,000 verses)
- **Total: 5-10 minutes** for all 5 translations

**Database impact:**
- Rows: 31,102 verses
- Storage: ~15 MB per translation (~75 MB total)
- Indexes: Automatically created by Prisma

## Troubleshooting

### Download Fails

**Issue:** `curl` not found or download errors

**Solution:**
```bash
# Install curl (if needed)
sudo apt install curl  # Ubuntu/Debian
brew install curl      # macOS

# Or download manually
cd data/csv
wget https://raw.githubusercontent.com/scrollmapper/bible_databases/master/csv/t_kjv.csv
wget https://raw.githubusercontent.com/scrollmapper/bible_databases/master/csv/t_web.csv
wget https://raw.githubusercontent.com/scrollmapper/bible_databases/master/csv/t_asv.csv
wget https://raw.githubusercontent.com/scrollmapper/bible_databases/master/csv/t_bbe.csv
wget https://raw.githubusercontent.com/scrollmapper/bible_databases/master/csv/t_ylt.csv
```

### Parsing Errors

**Issue:** CSV format mismatch or encoding issues

**Solution:**
- Files should be UTF-8 encoded
- Verify CSV structure matches expected format
- Check for corrupted download (re-download)

### Database Errors

**Issue:** Duplicate key errors or constraint violations

**Solution:**
```bash
# Reset database and try again
npm run db:push -- --force-reset
npm run ingest:bible
```

### Slow Import

**Issue:** Taking longer than 10 minutes

**Solution:**
- Check database connection (local vs cloud)
- Cloud databases (Supabase) may be slower
- Consider using connection pooling
- Increase batch size in script (advanced)

## Re-running Ingestion

The script is idempotent (safe to run multiple times):
- **Books:** Uses `upsert` - won't create duplicates
- **Verses:** Uses `upsert` - updates existing records
- **Downloads:** Skips if file already exists

To force re-download:
```bash
rm -rf data/csv
npm run ingest:bible
```

## Next Steps

After successful ingestion:

1. **Verify Data:**
   ```bash
   npm run db:studio
   ```

2. **Seed Situations:**
   Create sample situations for testing:
   ```bash
   npm run seed:situations  # (create this script)
   ```

3. **Start Development:**
   ```bash
   npm run dev
   ```

4. **Test Pages:**
   - http://localhost:3000
   - http://localhost:3000/bible-verses-for-anxiety (after seeding situations)

## Alternative: Manual SQL Import

For even faster import (30 seconds):

```bash
# 1. Download CSV files
cd data/csv
wget https://raw.githubusercontent.com/scrollmapper/bible_databases/master/csv/t_web.csv

# 2. Import directly to PostgreSQL
psql $DATABASE_URL << EOF
COPY verses (id, book_id, chapter, verse_number, text_web)
FROM '/absolute/path/to/data/csv/t_web.csv'
WITH (FORMAT csv, HEADER true);
EOF
```

**Note:** Requires direct database access and absolute file paths.

## License & Commercial Use

All CSV files from ScrollMapper use **public domain** translations:
- ✅ Free for commercial use
- ✅ Can be redistributed
- ✅ No attribution required (but appreciated)
- ✅ No usage limits
- ✅ Safe for ad-supported websites

## Support & Credits

**Data Source:**
- ScrollMapper Bible Databases
- GitHub: https://github.com/scrollmapper/bible_databases
- Maintainer: @scrollmapper

**Translations:**
- Public Domain Bible translations
- Original translators credited in respective documentation

---

**Last Updated:** 2026-01-05
**Script Version:** 1.0
