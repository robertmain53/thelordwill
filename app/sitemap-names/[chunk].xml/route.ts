/**
 * Names Sitemap (Chunked)
 * All /meaning-of-[name]-in-the-bible pages
 * Split into chunks of 10,000 URLs
 */

import { NextRequest } from 'next/server';
import { generateNamesSitemap } from '@/lib/seo/sitemap-generator';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest
) {
  const match = request.nextUrl.pathname.match(/\/sitemap-names\/([^/]+)\.xml$/);
  const chunk = match?.[1];
  const chunkNumber = parseInt(chunk || '', 10);

  if (isNaN(chunkNumber) || chunkNumber < 1) {
    return new Response('Invalid chunk number', { status: 400 });
  }

  const sitemap = await generateNamesSitemap(chunkNumber);

  if (sitemap.length === 0) {
    if (!process.env.DATABASE_URL) {
      const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;

      return new Response(emptyXml, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      });
    }

    return new Response('Chunk not found', { status: 404 });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap
  .map(
    (entry) => {
      const lastModified = entry.lastModified
        ? new Date(entry.lastModified).toISOString()
        : new Date().toISOString();

      return `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${(entry.priority ?? 0.5).toFixed(2)}</priority>
  </url>`;
    }
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
