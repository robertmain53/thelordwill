/**
 * Places Sitemap
 * All /bible-places/[slug] pages (published only)
 */

import { generatePlacesSitemap } from '@/lib/seo/sitemap-generator';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sitemap = await generatePlacesSitemap();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap
  .map((entry) => {
    const lastModified = entry.lastModified
      ? new Date(entry.lastModified).toISOString()
      : new Date().toISOString();
    const priority = (entry.priority ?? 0.5).toFixed(2);

    return `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  })
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
