# Quick Start Guide

Get the Bible pSEO Engine running in 5 minutes.

## Prerequisites

- Node.js 20.9.0+ ([Download](https://nodejs.org/))
- PostgreSQL ([Download](https://www.postgresql.org/download/))
- Git

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/thelordwill"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### 3. Setup Database

```bash
# Generate Prisma Client
npm run db:generate

# Create database schema
npm run db:push
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure Overview

```
app/
├── layout.tsx                              # Global metadata + JSON-LD
├── page.tsx                                # Homepage
└── [dynamic-routes]/                       # pSEO pages

lib/
├── db/                                     # Database queries (Prisma)
├── api/                                    # Bible API wrappers
└── utils.ts                                # Helper functions

components/
├── search-bar.tsx                          # Client component (interactive)
└── verse-card.tsx                          # Server component (static)

prisma/
└── schema.prisma                           # Database schema
```

## Key Routes

- **Homepage**: [http://localhost:3000](http://localhost:3000)
- **Name Example**: [http://localhost:3000/meaning-of-john-in-the-bible](http://localhost:3000/meaning-of-john-in-the-bible)
- **Situation Example**: [http://localhost:3000/bible-verses-for-anxiety](http://localhost:3000/bible-verses-for-anxiety)
- **Profession Example**: [http://localhost:3000/bible-verses-for-teacher](http://localhost:3000/bible-verses-for-teacher)

## Available Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema to database
npm run db:studio        # Open Prisma Studio (database GUI)
```

## Next Steps

1. **Populate Database**: Add biblical names, situations, and professions
2. **Customize Design**: Edit components in `components/`
3. **Configure APIs**: Add Bible API keys to `.env`
4. **Test Performance**: Run Lighthouse audit
5. **Deploy**: Follow [DEPLOYMENT.md](DEPLOYMENT.md)

## Common Issues

### Port Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

### Database Connection Error

1. Verify PostgreSQL is running
2. Check `DATABASE_URL` in `.env`
3. Ensure database exists

```bash
# Create database
createdb thelordwill
```

### Module Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### Build Errors

```bash
# Type check
npx tsc --noEmit

# Check for errors
npm run lint
```

## Development Workflow

### Creating a New Dynamic Route

1. **Create route folder**:
   ```bash
   mkdir -p app/new-route-[param]
   ```

2. **Create page.tsx**:
   ```typescript
   // app/new-route-[param]/page.tsx
   import type { Metadata } from "next";

   export const dynamic = 'force-dynamic';

   export async function generateMetadata({ params }): Promise<Metadata> {
     return {
       title: "Your Title",
       description: "Your description",
       alternates: {
         canonical: getCanonicalUrl(`/new-route-${params.param}`),
       },
     };
   }

   export default async function Page({ params }) {
     return <div>Your content</div>;
   }
   ```

3. **Add database model** (if needed):
   ```prisma
   // prisma/schema.prisma
   model YourModel {
     id   String @id @default(cuid())
     slug String @unique
     // ...
   }
   ```

4. **Generate Prisma Client**:
   ```bash
   npm run db:generate
   npm run db:push
   ```

### Adding a Client Component

1. **Create component with 'use client'**:
   ```typescript
   // components/your-component.tsx
   'use client';

   export function YourComponent() {
     // Interactive logic
   }
   ```

2. **Keep it minimal**: Only add interactivity where needed

3. **Test performance impact**: Ensure LCP/INP targets are met

## Performance Tips

- ✅ Use Server Components by default
- ✅ Add 'use client' only for interactive elements
- ✅ Cache database queries with `cache()`
- ✅ Use Next.js Image component
- ✅ Implement proper loading states
- ✅ Monitor Web Vitals

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)

## Getting Help

- Check [README.md](README.md) for full documentation
- Review [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment guide

## What's Next?

1. Explore the codebase
2. Customize the design
3. Add your content
4. Test performance
5. Deploy to production

Happy coding! 🚀
