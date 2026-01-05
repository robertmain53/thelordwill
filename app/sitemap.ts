/**
 * Sitemap Index Generator
 * Creates main sitemap index that references chunked sitemaps
 * Handles 100k+ pages with 10,000 URL chunks
 */

import { MetadataRoute } from 'next';
import { getCanonicalUrl } from '@/lib/utils';

export default function sitemap(): MetadataRoute.Sitemap {
  // Main sitemap index pointing to chunked sitemaps
  return [
    {
      url: getCanonicalUrl('/sitemap-static.xml'),
      lastModified: new Date(),
    },
    {
      url: getCanonicalUrl('/sitemap-situations.xml'),
      lastModified: new Date(),
    },
    {
      url: getCanonicalUrl('/sitemap-names/1.xml'),
      lastModified: new Date(),
    },
    {
      url: getCanonicalUrl('/sitemap-names/2.xml'),
      lastModified: new Date(),
    },
    {
      url: getCanonicalUrl('/sitemap-professions.xml'),
      lastModified: new Date(),
    },
  ];
}
