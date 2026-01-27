# Publish State Backfill

This document describes the one-time backfill script for setting `status` and
`publishedAt` fields on existing content records.

## Purpose

Content models (PrayerPoint, Place, Situation, Profession, TravelItinerary) now
support publish states (`draft` / `published`). This script retroactively sets
these fields based on deterministic content completeness rules.

## How to Run

### Dry-Run (Default - Safe)

```bash
node scripts/backfill-publish-states.mjs
```

This will:
- Analyze all records across all content models
- Print a summary table showing what WOULD change
- **NOT modify any data**

Example output:
```
Publish State Backfill Script
Mode: DRY-RUN

This is a dry-run. No changes will be made.
Use --apply to actually update the database.

Analyzing records...

================================================================================
BACKFILL SUMMARY
================================================================================

Model                   Total    Publish      Draft    Unchanged
--------------------------------------------------------------
PrayerPoint               150         45         12           93
Place                      87         72          5           10
Situation                 234        198         20           16
Profession                 45         30         10            5
TravelItinerary            12         10          2            0
--------------------------------------------------------------
TOTAL                     528        355         49          124

================================================================================

To apply these changes, run:
  node scripts/backfill-publish-states.mjs --apply
```

### Apply Mode (Modifies Database)

```bash
node scripts/backfill-publish-states.mjs --apply
```

This will:
- Analyze all records
- Print the summary table
- **Actually update** records in batches of 200

### Verbose Mode

Add `--verbose` or `-v` to see individual record details:

```bash
node scripts/backfill-publish-states.mjs --verbose
node scripts/backfill-publish-states.mjs --apply --verbose
```

## Backfill Rules

The script uses deterministic rules to decide whether a record should be
published or remain a draft.

### Rule Priority

1. **Already has `publishedAt`** → Set `status="published"` (preserve existing)
2. **Has sufficient content** → Set `status="published"`, `publishedAt=updatedAt`
3. **Insufficient content** → Set `status="draft"`, `publishedAt=null`

### Sufficient Content Definitions

| Model | Rule |
|-------|------|
| **PrayerPoint** | `description` non-empty AND (`content` exists OR `verseMappings` ≥ 1) |
| **Place** | `description` non-empty AND (`biblicalContext` exists OR `verseMentions` ≥ 1) |
| **Situation** | `metaDescription` non-empty AND (`content` exists OR `verseMappings` ≥ 1) |
| **Profession** | `description` non-empty AND `content` exists |
| **TravelItinerary** | `title` non-empty AND `dayPlans` ≥ 1 |

**Note:** TravelItinerary only has `status`, not `publishedAt`.

## Safety Notes

### DO

- ✅ **Always run dry-run first** to verify expected changes
- ✅ **Back up database** before running `--apply` in production
- ✅ **Run during low-traffic periods** to minimize lock contention
- ✅ **Verify results** after applying by checking a sample of records

### DON'T

- ❌ **Don't skip dry-run** - always verify expected changes first
- ❌ **Don't run multiple times concurrently** - may cause race conditions
- ❌ **Don't modify the rules** without updating this documentation

## Idempotency

This script is **idempotent**. Running it multiple times will:
- Produce the same results
- Not modify already-correct records
- Show `0` in Publish/Draft columns for models that are already backfilled

## Default Behavior for New Records

After backfill, all NEW records default to:
- `status = "draft"` (set in Prisma schema)
- `publishedAt = null`

Records must be explicitly published through the admin UI to become visible
on the public site.

## Verification

After running with `--apply`, verify the backfill worked:

```bash
# Check counts
npx prisma studio
# Or via CLI:
npx prisma db execute --stdin <<< "SELECT status, COUNT(*) FROM \"PrayerPoint\" GROUP BY status"
```

## Rollback

If you need to undo the backfill, there is no automatic rollback. Options:

1. **Restore from backup** (recommended)
2. **Set all to draft** (nuclear option):
   ```sql
   UPDATE "PrayerPoint" SET status = 'draft', "publishedAt" = NULL;
   UPDATE "Place" SET status = 'draft', "publishedAt" = NULL;
   -- etc.
   ```

## Troubleshooting

### Script hangs during apply

The script processes in batches of 200. Large tables may take time.
Check database logs for lock contention.

### Some records not updated

Check if records match the "sufficient content" rules. Use `--verbose` to see
which records are being skipped and why.

### Status still shows as draft after apply

Verify the record was actually updated:
```bash
npx prisma db execute --stdin <<< "SELECT id, status, \"publishedAt\" FROM \"PrayerPoint\" WHERE slug = 'your-slug'"
```
