import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thelordwill.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/private/',
        ],
      },
      // Google-specific rules
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/private/'],
        crawlDelay: 0,
      },
      // Prioritize Spanish content for Google Latin America
      {
        userAgent: 'Googlebot',
        allow: ['/es/', '/es/bible-verses-for-*', '/es/meaning-of-*'],
      },
      // Prioritize Portuguese content for Google Brazil
      {
        userAgent: 'Googlebot',
        allow: ['/pt/', '/pt/bible-verses-for-*', '/pt/meaning-of-*'],
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/es/sitemap.xml`,
      `${baseUrl}/pt/sitemap.xml`,
    ],
  };
}
