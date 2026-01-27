# Development Database Policy

This document describes the deterministic workflow for managing Prisma migrations
in development to prevent schema drift and data loss.

## Golden Rules

### DO

1. **Always create new migrations** for schema changes:
   ```bash
   npx prisma migrate dev --name descriptive_name
   ```

2. **Run preflight check** before development (automatic via `npm run dev`):
   ```bash
   node scripts/prisma-preflight.mjs
   ```

3. **Commit migrations immediately** after creating them:
   ```bash
   git add prisma/migrations/
   git commit -m "Add migration: descriptive_name"
   ```

4. **Check migration status** when unsure:
   ```bash
   npm run db:status
   ```

5. **Deploy migrations** in staging/production:
   ```bash
   npm run db:deploy
   ```

### DON'T

1. **NEVER modify an applied migration file**
   - Once a migration is applied, its SQL is immutable
   - Modifying causes checksum mismatch (drift)
   - Create a new migration instead

2. **NEVER delete migration files** that have been applied
   - This breaks the migration history chain
   - Other environments will fail to sync

3. **NEVER run `db:reset` on production**
   - This drops all data
   - Only use for local development

4. **NEVER skip the preflight check**
   - It exists to catch drift before it causes problems
   - If it fails, fix the issue—don't bypass it

## Workflow: Making Schema Changes

### Step 1: Modify schema.prisma

Edit your Prisma schema as needed:

```prisma
model NewModel {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
}
```

### Step 2: Create migration

```bash
npx prisma migrate dev --name add_new_model
```

This will:
- Create a new migration file in `prisma/migrations/`
- Apply the migration to your dev database
- Regenerate the Prisma client

### Step 3: Commit the migration

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "Add NewModel table"
```

### Step 4: Push to remote

Other developers will get the migration when they pull.

## Handling Common Issues

### Issue: Preflight Check Fails with "Drift Detected"

**Cause:** A migration file was modified after being applied.

**Resolution Options:**

1. **Restore from git** (if accidentally modified):
   ```bash
   git checkout HEAD -- prisma/migrations/
   ```

2. **Reset database** (if intentional, dev only):
   ```bash
   npm run db:reset
   ```

### Issue: Preflight Check Fails with "Pending Migrations"

**Cause:** New migrations exist that haven't been applied.

**Resolution:**

```bash
# For development (with shadow DB validation)
npx prisma migrate dev

# For staging/production
npm run db:deploy
```

### Issue: Database Connection Failed

**Cause:** Database server not running or wrong credentials.

**Resolution:**

1. Check DATABASE_URL in `.env`:
   ```bash
   cat .env | grep DATABASE_URL
   ```

2. Verify database server is running:
   ```bash
   # PostgreSQL
   pg_isready -h localhost -p 5432

   # Docker
   docker ps | grep postgres
   ```

3. Test connection:
   ```bash
   npx prisma db execute --stdin <<< 'SELECT 1'
   ```

## Available Scripts

| Script | Description | Safe for Production? |
|--------|-------------|---------------------|
| `npm run dev` | Start dev server (runs preflight first) | N/A |
| `npm run db:status` | Show migration status | Yes |
| `npm run db:deploy` | Apply pending migrations | Yes |
| `npm run db:reset` | Drop and recreate database | **NO** |
| `npm run db:studio` | Open Prisma Studio GUI | Yes |
| `npm run db:generate` | Regenerate Prisma client | Yes |

## Preflight Check Details

The preflight script (`scripts/prisma-preflight.mjs`) runs automatically before
`npm run dev` and checks for:

1. **Database connectivity** - Can we reach the database?
2. **Pending migrations** - Are there unapplied migrations?
3. **Migration drift** - Were applied migrations modified?
4. **Git changes** - Are there uncommitted migration changes?

If any check fails, the dev server will NOT start, and you'll see:
- Exact description of the issue
- Specific commands to resolve it
- Warnings about destructive operations

## Emergency Procedures

### Complete Database Reset (Development Only)

If your local database is in an unrecoverable state:

```bash
# 1. Drop everything and start fresh
npm run db:reset

# 2. Optionally re-seed data
npm run seed:books
npm run seed:places
```

### Resolving Drift Without Reset

If you need to mark a modified migration as "resolved" without resetting:

```bash
# Mark specific migration as applied (use with caution)
npx prisma migrate resolve --applied "20260120135002_migration_name"
```

This tells Prisma "trust me, the database matches this migration" even if the
file changed. Only use this if you're certain the database state is correct.

## Production Deployment

Production should NEVER run `migrate dev` or `migrate reset`. Instead:

```bash
# In CI/CD pipeline
npx prisma migrate deploy
```

This only applies pending migrations and never modifies existing ones.
