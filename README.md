# The Lord Will - Bible pSEO Engine

A high-performance Next.js 15 application targeting 50,000+ programmatic SEO pages for biblical content. Built with a "Log-First" SEO approach and optimized for crawl efficiency.

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **Rendering**: Server-Side Rendering (SSR) for all routes

### Performance Targets
- ✅ LCP (Largest Contentful Paint): < 2.0s
- ✅ INP (Interaction to Next Paint): < 200ms
- ✅ Selective Hydration: Minimal client-side JS

### Database Features
- **8-Digit Verse IDs**: BBCCCVVV format (e.g., 01001001 = Genesis 1:1)
- **Multi-Language Support**: 5 English translations (KJV, WEB, ASV, BBE, YLT)
- **Strong's Concordance**: Hebrew/Greek word mappings
- **Relevance Scoring**: Situation-to-verse mappings with 1-100 scores
- **Optimized Indexes**: Fast cross-referencing and relational queries
- **Data Ingestion**: Automated scripts for Bolls Life API

See [DATABASE.md](DATABASE.md) for complete schema documentation.

## Project Structure

```
thelordwill/
├── app/
│   ├── layout.tsx                              # Root layout with global metadata & JSON-LD
│   ├── page.tsx                                # Homepage
│   ├── meaning-of-[name]-in-the-bible/         # Dynamic route: Biblical names
│   │   └── page.tsx
│   ├── bible-verses-for-[situation]/           # Dynamic route: Situations
│   │   └── page.tsx
│   └── bible-verses-for-[profession]/          # Dynamic route: Professions
│       └── page.tsx
├── components/
│   ├── search-bar.tsx                          # Client component (Interactive Island)
│   └── verse-card.tsx                          # Server component (Static)
├── lib/
│   ├── api/
│   │   ├── bible.ts                            # Bible API wrappers
│   │   └── index.ts
│   ├── bible/
│   │   ├── verse-id.ts                         # Verse ID generation (BBCCCVVV)
│   │   ├── books.ts                            # Bible books metadata
│   │   ├── bolls-api.ts                        # Bolls Life API client
│   │   └── index.ts
│   ├── db/
│   │   ├── prisma.ts                           # Prisma client singleton
│   │   ├── queries.ts                          # Database queries (cached)
│   │   └── index.ts
│   ├── utils.ts                                # Utility functions (cn, canonical URLs)
│   └── performance.ts                          # Web Vitals monitoring
├── prisma/
│   └── schema.prisma                           # Optimized multi-language schema
├── scripts/
│   ├── ingest-bible-data.ts                    # Bible data ingestion from Bolls API
│   └── ingest-strongs.ts                       # Strong's Concordance ingestion
├── next.config.ts                              # Next.js configuration
├── tailwind.config.ts                          # Tailwind configuration
└── tsconfig.json                               # TypeScript configuration
```

## Key Features

### 1. Force SSR for All Routes
All dynamic routes use `export const dynamic = 'force-dynamic'` to ensure server-side rendering:
- Better SEO and crawl efficiency
- Faster initial page load
- No static generation delays

### 2. Global Metadata Configuration
Root layout ([app/layout.tsx](app/layout.tsx)) includes:
- `metadataBase` for absolute URLs
- Organization & Website JSON-LD schema
- Global OpenGraph and Twitter card defaults

### 3. Dynamic Route Metadata
Each dynamic route ([example](app/meaning-of-[name]-in-the-bible/page.tsx)) implements:
- `generateMetadata()` function
- Absolute canonical URLs
- Route-specific OpenGraph images
- Twitter card optimization
- Page-specific JSON-LD schema

### 4. Selective Hydration (Interactive Islands)
**Server Components (No JS)**:
- [VerseCard](components/verse-card.tsx) - Static content display
- All layout components
- Most page content

**Client Components (Minimal JS)**:
- [SearchBar](components/search-bar.tsx) - Interactive search
- Only components requiring interactivity

### 5. Database Schema
Optimized Prisma schema ([prisma/schema.prisma](prisma/schema.prisma)) with:
- Biblical names, situations, and professions
- Bible verses with relationships
- Analytics tracking for popular pages
- Full-text search support
- Efficient indexing for queries

### 6. Performance Monitoring
- Web Vitals tracking ([lib/performance.ts](lib/performance.ts))
- LCP and INP monitoring
- Performance thresholds validation

## Getting Started

### Prerequisites
- Node.js 20.9.0+ (required for Next.js 15)
- PostgreSQL database
- Bible API keys (optional for development)

### Installation

1. **Clone and install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- Database URLs
- Site URL
- API keys

3. **Set up database**:
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Open Prisma Studio
npm run db:studio

# Ingest Bible data (30-60 minutes)
npm run ingest:bible

# Ingest Strong's Concordance
npm run ingest:strongs

# Or run both
npm run ingest:all
```

See [INGESTION.md](INGESTION.md) for detailed ingestion guide.

4. **Run development server**:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## SEO Strategy

### URL Structure
- Names: `/meaning-of-{name}-in-the-bible`
- Situations: `/bible-verses-for-{situation}`
- Professions: `/bible-verses-for-{profession}`

### Metadata Best Practices
1. **Canonical URLs**: All pages use absolute canonical URLs
2. **OpenGraph**: Complete OG tags for social sharing
3. **Twitter Cards**: Summary large image cards
4. **JSON-LD**: Structured data for rich snippets
5. **Keywords**: Relevant, targeted keywords per page

### Performance Optimization
1. **SSR**: All pages server-rendered for instant crawling
2. **Image Optimization**: Next.js Image with AVIF/WebP
3. **Font Loading**: `font-display: swap` for faster FCP
4. **Caching**: React cache() for database queries
5. **Compression**: Gzip/Brotli enabled

## Verification & QA Pipeline

- **QA Scripts** (`npm run qa:manifest`, `qa:quality`, `qa:graph`, `qa:indexing`) run before releases to prove crawl depth, link density, sitemap integrity, and content quality across every published blueprint.  
- **Blueprint validation** (`scripts/verify-content-job.mjs`) evaluates every JSON blueprint via `@qe/factory` policies and emits a JSON or console report; failures surface before deploys to avoid publishing thin or mislinked copy.  
- **Logs & Metrics**: `logs.csv`, `logs_result.csv`, and the QA audit reports feed dashboards that monitor affiliate conversions, internal link health, and sitewide runtime metrics (LCP/INP).  
- **Preference alignment**: QA checks and the localization rollout follow the requested interim reviews after each major route (place detail, situations detail, professions list/detail, etc.), easing human oversight while the pipeline runs.

## Localization Roadmap

- **Primary English stack** is fully wired (situations, names, professions, places, prayer points, itineraries).  
- **Portuguese & Spanish launches** are built from the same blueprint pipeline but currently require fresh localized content for each `[locale]` route (situations detail, professions list/detail, place detail, `bible-verses-for-*`, and UI strings).  
- **Operational flow**: replicate the English ingestion → QA → internal linking loop for each locale, run `npm run qa:all` per locale, and verify localized URL manifests before publishing.  
- **Next steps**: batch build small groups of localized routes, run the verification job + QA per batch, gather interim reviews, then push translations once they meet the 300+ word/anchor/link requirements.

## Monetization & Business Goal

- **30 000 € / month target** powered by affiliate programs (Bible study tools, travel partners for pilgrimage sites, trusted publishers).  
- **Lead indicators**: QA quality pass rate, conversion-focused internal links, and steady LCP/INP metrics ensure affiliates see premium traffic.  
- **Operational hygiene**: Deployments trigger the verification job, QA scripts, and link audits, while localized pages inherit the same monetization tracking (UTMs, click paths) so every language contributes toward the revenue goal.

## Database Queries

All queries are cached using React's `cache()` function:
- `getBiblicalName(slug)` - Fetch name with verses
- `getSituation(slug)` - Fetch situation with verses
- `getProfession(slug)` - Fetch profession with verses
- `trackPageView()` - Analytics tracking
- `getPopularPages()` - Sitemap prioritization

## Implementation & Operations

### Stack and tooling
- **Next.js 15.3 App Router** with React 19 and TypeScript 5 server components plus `tsx` scripts for ingestion/QA/autogeneration.
- **Tailwind CSS 3** with `tailwind-merge`, `class-variance-authority`, and `lucide-react` for the responsive UI system.
- **Prisma 6** ORM on PostgreSQL 12+ (with `DATABASE_URL`/`DIRECT_URL` pairing) and Prisma client instantiation in `lib/db/prisma.ts`.
- **Infrastructure scripts:** `scripts/ingest-from-csv.ts`, `scripts/ingest-bible-simple.ts`, `scripts/ingest-multilang.ts`, `scripts/ingest-strongs.ts`, `scripts/seed-*` populate the schema; `scripts/index-vectors.mjs` and `scripts/embeddings/generate-verse-embeddings.ts` build the semantic layer.

### Operational workflow
- **Data ingestion:** `ingest` scripts hydrate books, situations, professions, verses, and Strong's mappings while writing `IngestionLog` records; reruns use `upsert` semantics so failures can be retried without duplicates.
- **Content generation:** `lib/content/generator.ts`, AI prompt helpers, translation components, and FAQ schema wiring feed the `/bible-verses-for-*` and `/meaning-of-*` pages; `lib/seo/internal-linking.ts` guarantees the 5–15 link density described below while `components/search-bar.tsx` stays as the only hydrated client island on those pages.
- **Quality assurance & indexing:** `scripts/build-url-manifest.mjs`, `scripts/qa-*.mjs` (quality, graph, sitemaps, indexing, click-depth, semantic-search), and `lib/performance.ts` guard metadata, canonical URLs, web vitals, and vector indexes before deploys.
- **Monitoring & reports:** `logs.csv` and `logs_result.csv` track ingestion/QA events, while `lib/performance.ts` and `app/layout.tsx` share metadata for analytics.
- **Deployments:** per `DEPLOYMENT.md`, we push to Vercel (Node 20.9, `npm run build`) with environment variables, migrations, and post-launch QA runs.

### Cadence
- Weekly or on-demand ingestion runs refresh translations and Strong's numbers; QA scripts execute before every production release, and embeddings/vector scripts update once new verse data lands.
- Analytics tracking, sitemap submission, and canonical audits happen monthly as part of the monitoring checklist.

## Monetization & Revenue Targets

### Revenue stack
- **Affiliate anchor:** The Holy Land tours funnel documented in `TOUR_MONETIZATION_GUIDE.md` captures high-intent leads with `TourLeadForm`, Lead API endpoints, and contextual CTAs; 15% commissions on $3K–$8K tickets mean ~$750 per booking, so 40 bookings per month hit the 30,000 € target.
- **Ad revenue:** `UI_UX_MONETIZATION.md` describes the Mediavine/Raptive placements (ATF leaderboard, mid-content rectangle, sticky sidebar) that keep RPMs elevated while bolstering trust via E-E-A-T compliance pages.
- **Secondary affiliates:** Advisory guides, downloadable pilgrim PDFs, and the budget calculator (all surfaced through content pages and internal linking) keep additional affiliate links in rotation.

### Operational objectives for 30K € / month
- Programmatic pages (names, situations, professions, and place landing pages) funnel organic traffic into lead forms and affiliate CTAs that feed the 30K € goal while the internal linking rules ensure each conversion page is reachable within three clicks.
- Weekly QA & performance audits ensure high LCP/INP scores so both affiliate and ad partners see consistent traffic volumes; these audits are on the same cadence as the ingestion/QA pipeline.
- Monitoring dashboards surface bookings, affiliate click-throughs, and ad RPMs so we can refine the mix between tours and ad revenue toward the 30K € target.

## API Integration

Bible API wrappers ([lib/api/bible.ts](lib/api/bible.ts)) support:
- API.Bible integration
- ESV API integration
- Verse fetching and parsing
- Search functionality
- Reference formatting

## Development Tips

### Adding New Routes
1. Create new dynamic route folder in `app/`
2. Implement `generateMetadata()` function
3. Add `export const dynamic = 'force-dynamic'`
4. Include page-specific JSON-LD schema
5. Update database schema if needed

### Adding Interactive Components
1. Use `'use client'` directive sparingly
2. Keep components small and focused
3. Prefer server components for static content
4. Test performance impact

### Database Migrations
```bash
# Create migration
npx prisma migrate dev --name your_migration_name

# Apply migration
npx prisma migrate deploy
```

## Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Set environment variables
3. Deploy

### Other Platforms
Ensure:
- Node.js 20.9.0+
- PostgreSQL database
- Environment variables configured

## Performance Checklist

- [ ] LCP < 2.0s
- [ ] INP < 200ms
- [ ] CLS < 0.1
- [ ] Minimal client-side JS
- [ ] All images optimized
- [ ] Fonts preloaded
- [ ] Database queries cached
- [ ] SSR for all routes

## License

Private project - All rights reserved

## Support

For issues or questions, contact the development team.
