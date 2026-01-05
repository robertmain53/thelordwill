# Database Schema Documentation

## Overview

This document describes the PostgreSQL database schema optimized for fast relational queries and cross-referencing in a multi-language Bible database.

## Key Features

- **8-Digit Verse IDs**: BBCCCVVV format (Book-Chapter-Verse)
- **Multi-Language Support**: 5 English translations in single table
- **Strong's Concordance**: Word-level Hebrew/Greek mappings
- **Optimized Indexes**: Fast queries for cross-referencing
- **Relevance Scoring**: Situation-to-verse mappings with scores

## Schema Design

### Verse ID Format (BBCCCVVV)

The primary key for verses uses an 8-digit integer format:
- **BB**: Book number (01-66)
- **CCC**: Chapter number (001-999)
- **VVV**: Verse number (001-999)

**Examples:**
- `01001001` = Genesis 1:1 (Book 01, Chapter 001, Verse 001)
- `43003016` = John 3:16 (Book 43, Chapter 003, Verse 016)

**Benefits:**
- Sequential ordering
- Fast lookups (integer comparison)
- Range queries (e.g., all verses in Genesis 1)
- No compound keys needed

### Core Tables

#### 1. Book

Stores metadata for all 66 books of the Bible.

```prisma
model Book {
  id        Int      @id           // 1-66
  name      String   @unique       // "Genesis", "John", etc.
  slug      String   @unique       // "genesis", "john"
  testament String                 // "OT" or "NT"
  genre     String                 // "Law", "Gospel", "Epistle", etc.
  chapters  Int                    // Total chapters
  verses    Int                    // Total verses
}
```

**Indexes:**
- Primary key on `id`
- Unique on `name`, `slug`
- Index on `testament`, `genre`

#### 2. Verse

Stores all verses with 5 English translations.

```prisma
model Verse {
  id           Int      @id        // BBCCCVVV format
  bookId       Int                 // Foreign key to Book
  chapter      Int
  verseNumber  Int

  // Translations
  textKjv      String?  @db.Text  // King James Version
  textWeb      String?  @db.Text  // World English Bible
  textAsv      String?  @db.Text  // American Standard Version
  textBbe      String?  @db.Text  // Bible in Basic English
  textYlt      String?  @db.Text  // Young's Literal Translation

  wordsCount   Int?                // For analytics
}
```

**Indexes:**
- Primary key on `id`
- Unique on `[bookId, chapter, verseNumber]`
- Index on `[bookId, chapter]` for chapter queries
- Index on `bookId` for book queries

**Design Rationale:**
- All translations in one table reduces JOIN complexity
- NULL translations allow incremental loading
- Text fields for variable-length content
- Word count for search ranking

#### 3. StrongsLexicon

Hebrew and Greek word definitions from Strong's Concordance.

```prisma
model StrongsLexicon {
  strongsId      String   @id      // "H1" or "G1"
  originalWord   String            // Hebrew/Greek characters
  transliteration String           // Romanized pronunciation
  definition     String   @db.Text
  language       String            // "Hebrew" or "Greek"
  occurrences    Int      @default(0)  // Usage count
}
```

**Indexes:**
- Primary key on `strongsId`
- Index on `language`
- Index on `occurrences` for popularity sorting

#### 4. VerseStrong

Many-to-many relationship between verses and Strong's numbers.

```prisma
model VerseStrong {
  id           String   @id @default(cuid())
  verseId      Int                    // Foreign key to Verse
  strongsId    String                 // Foreign key to StrongsLexicon
  position     Int?                   // Word position in verse
}
```

**Indexes:**
- Unique on `[verseId, strongsId, position]`
- Index on `verseId` for verse lookups
- Index on `strongsId` for word lookups

**Design Rationale:**
- Supports multiple occurrences of same word
- Position tracking for interlinear display
- Enables concordance queries

#### 5. Name

Biblical names and characters.

```prisma
model Name {
  id                    String   @id @default(cuid())
  name                  String   @unique
  slug                  String   @unique
  meaning               String
  originLanguage        String   // "Hebrew", "Greek", "Aramaic"
  characterDescription  String   @db.Text
  firstMentionVerseId   Int?     // Foreign key to Verse
}
```

**Indexes:**
- Primary key on `id`
- Unique on `name`, `slug`
- Index on `originLanguage`

#### 6. NameMention

Tracks all mentions of a name throughout the Bible.

```prisma
model NameMention {
  id        String   @id @default(cuid())
  nameId    String   // Foreign key to Name
  verseId   Int      // Foreign key to Verse
  context   String?  @db.Text
}
```

**Indexes:**
- Unique on `[nameId, verseId]`
- Index on `nameId` for name lookups
- Index on `verseId` for verse lookups

#### 7. Situation

Topics and life situations.

```prisma
model Situation {
  id              String   @id @default(cuid())
  slug            String   @unique
  title           String   @unique
  metaDescription String   @db.Text
  category        String?  // "emotion", "life-event", etc.
}
```

**Indexes:**
- Primary key on `id`
- Unique on `slug`, `title`
- Index on `category`

#### 8. SituationVerseMapping

Maps situations to relevant verses with relevance scoring.

```prisma
model SituationVerseMapping {
  id             String   @id @default(cuid())
  situationId    String   // Foreign key to Situation
  verseId        Int      // Foreign key to Verse
  relevanceScore Int      @default(50)  // 1-100
  manualNote     String?  @db.Text
  isVerified     Boolean  @default(false)
}
```

**Indexes:**
- Unique on `[situationId, verseId]`
- Index on `[situationId, relevanceScore]` for sorted queries
- Index on `relevanceScore` for filtering

**Design Rationale:**
- Relevance scoring enables "best verses" queries
- Manual notes for curation
- Verification flag for quality control

## Query Patterns

### 1. Get Verse by ID

```typescript
const verse = await prisma.verse.findUnique({
  where: { id: 43003016 }, // John 3:16
  include: { book: true }
});
```

**Performance:** O(1) - Primary key lookup

### 2. Get Chapter

```typescript
const chapter = await prisma.verse.findMany({
  where: {
    bookId: 1,
    chapter: 1,
  },
  orderBy: { verseNumber: 'asc' }
});
```

**Performance:** Fast - Uses `[bookId, chapter]` index

### 3. Get Top Verses for Situation

```typescript
const verses = await prisma.situationVerseMapping.findMany({
  where: { situationId },
  orderBy: { relevanceScore: 'desc' },
  take: 10,
  include: {
    verse: {
      include: { book: true }
    }
  }
});
```

**Performance:** Fast - Uses `[situationId, relevanceScore]` index

### 4. Find Verses with Strong's Number

```typescript
const verses = await prisma.verseStrong.findMany({
  where: { strongsId: 'G26' }, // agape (love)
  include: {
    verse: {
      include: { book: true }
    }
  }
});
```

**Performance:** Fast - Uses `strongsId` index

### 5. Get Name Mentions

```typescript
const mentions = await prisma.nameMention.findMany({
  where: { nameId },
  include: {
    verse: {
      include: { book: true }
    }
  }
});
```

**Performance:** Fast - Uses `nameId` index

## Data Ingestion

### Scripts

1. **ingest-bible-data.ts**
   - Seeds books table
   - Fetches verses from Bolls Life API
   - Ingests 5 English translations
   - Tracks progress with ingestion logs

2. **ingest-strongs.ts**
   - Seeds Strong's Lexicon
   - Creates verse-to-Strong's mappings
   - Initializes verse popularity tracking

### Running Ingestion

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Ingest Bible data (takes ~30-60 minutes)
npm run ingest:bible

# Ingest Strong's numbers
npm run ingest:strongs

# Or run both
npm run ingest:all
```

### API Rate Limiting

The ingestion script includes rate limiting:
- 100ms delay between chapter fetches
- Prevents API throttling
- Can be adjusted based on API limits

## Performance Optimization

### 1. Indexes

All frequently queried fields have indexes:
- Foreign keys
- Unique constraints
- Sort fields (relevanceScore)
- Filter fields (testament, genre, category)

### 2. Query Patterns

- Use `include` instead of separate queries
- Leverage `select` to fetch only needed fields
- Use `take` and `skip` for pagination
- Cache frequently accessed data

### 3. Database Configuration

Recommended PostgreSQL settings:

```sql
-- Connection pooling
max_connections = 100

-- Query optimization
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 10MB

-- Indexes
maintenance_work_mem = 128MB
```

## Data Integrity

### Constraints

1. **Unique Constraints**
   - Prevent duplicate verses
   - Enforce unique names, slugs
   - Prevent duplicate mappings

2. **Foreign Keys**
   - Cascade deletes for relationships
   - Referential integrity

3. **Default Values**
   - relevanceScore: 50 (neutral)
   - isVerified: false
   - occurrences: 0

### Validation

Client-side validation for:
- Verse ID format (8 digits)
- Book IDs (1-66)
- Relevance scores (1-100)
- Strong's ID format (H/G followed by digits)

## Scaling Considerations

### Current Capacity

- ~31,000 verses across 66 books
- 5 translations per verse
- ~8,000+ Strong's entries
- Unlimited situations and mappings

### Scaling Strategies

1. **Read Replicas**
   - For heavy read traffic
   - Separate analytics queries

2. **Partitioning**
   - Partition verses by testament
   - Partition logs by date

3. **Caching**
   - Redis for popular verses
   - CDN for static content

4. **Indexing**
   - Full-text search on verse text
   - Composite indexes for complex queries

## Migration Strategy

### Adding New Translation

```prisma
// Add column to Verse model
textNiv String? @db.Text

// Create migration
// npx prisma migrate dev --name add_niv_translation

// Update ingestion script
const TRANSLATIONS = [
  // ...existing
  { id: 'niv', field: 'textNiv' },
];
```

### Adding Custom Attributes

Use JSON fields for flexible attributes:

```prisma
model Verse {
  // ...existing fields
  customData Json?  // For flexible attributes
}
```

## Maintenance

### Regular Tasks

1. **Vacuum Database** (weekly)
   ```sql
   VACUUM ANALYZE;
   ```

2. **Reindex** (monthly)
   ```sql
   REINDEX DATABASE thelordwill;
   ```

3. **Backup** (daily)
   ```bash
   pg_dump thelordwill > backup_$(date +%Y%m%d).sql
   ```

4. **Monitor Query Performance**
   - Check slow query log
   - Analyze query plans
   - Add indexes as needed

## Appendix

### Book ID Reference

| ID | Book | Testament |
|----|------|-----------|
| 1-39 | Genesis - Malachi | OT |
| 40-66 | Matthew - Revelation | NT |

See [lib/bible/books.ts](lib/bible/books.ts) for complete list.

### Strong's Number Format

- **Hebrew**: H1 - H8674
- **Greek**: G1 - G5624

Examples:
- H3068: YHWH (LORD)
- G26: ἀγάπη (love)

### Verse ID Examples

| ID | Reference | Calculation |
|----|-----------|-------------|
| 01001001 | Genesis 1:1 | 01 + 001 + 001 |
| 19023001 | Psalm 23:1 | 19 + 023 + 001 |
| 43003016 | John 3:16 | 43 + 003 + 016 |
| 66022021 | Revelation 22:21 | 66 + 022 + 021 |

---

**Last Updated:** 2026-01-05
**Schema Version:** 1.0
