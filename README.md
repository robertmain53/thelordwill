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

## Database Queries

All queries are cached using React's `cache()` function:
- `getBiblicalName(slug)` - Fetch name with verses
- `getSituation(slug)` - Fetch situation with verses
- `getProfession(slug)` - Fetch profession with verses
- `trackPageView()` - Analytics tracking
- `getPopularPages()` - Sitemap prioritization

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
