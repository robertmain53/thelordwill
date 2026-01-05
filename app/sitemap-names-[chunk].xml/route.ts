/**
 * Names Sitemap (Chunked)
 * All /meaning-of-[name]-in-the-bible pages
 * Split into chunks of 10,000 URLs
 */

import { generateNamesSitemap } from '@/lib/seo/sitemap-generator';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ chunk: string }> }
) {
  const { chunk } = await params;
  const chunkNumber = parseInt(chunk, 10);

  if (isNaN(chunkNumber) || chunkNumber < 1) {
    return new Response('Invalid chunk number', { status: 400 });
  }

  const sitemap = await generateNamesSitemap(chunkNumber);

  if (sitemap.length === 0) {
    return new Response('Chunk not found', { status: 404 });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap
  .map(
    (entry) => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified.toISOString()}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority.toFixed(2)}</priority>
  </url>`
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
