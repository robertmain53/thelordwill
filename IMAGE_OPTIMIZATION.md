# Image Optimization Strategy

Complete guide for optimizing images across 100,000+ pages using Next.js Image component.

## Overview

This site serves biblical content with 100,000+ pages. Efficient image delivery is critical for:
- **Performance:** LCP < 2.0s target
- **SEO:** Core Web Vitals ranking factor
- **User Experience:** Fast, responsive images
- **Bandwidth:** Reduced data usage for mobile users

## Architecture

### Image Types

1. **Biblical Name Illustrations** (50,000+ pages)
   - Path: `/images/names/{slug}.png`
   - Dimensions: 600x600px source
   - Format: PNG with transparency (converted to AVIF/WebP)
   - Purpose: Character representations, historical scenes

2. **Situation Icons** (1,000+ pages)
   - Path: `/images/situations/{slug}.svg`
   - Format: SVG (vector, scalable)
   - Purpose: Symbolic representations (anxiety, joy, grief)

3. **Profession Graphics** (500+ pages)
   - Path: `/images/professions/{slug}.png`
   - Dimensions: 400x400px source
   - Purpose: Occupation illustrations

4. **UI Elements**
   - Logo: `/images/logo.png` (512x512px)
   - OpenGraph: `/images/og-default.png` (1200x630px)
   - Favicon: `/favicon.ico` (32x32px)

### Directory Structure

```
public/
├── images/
│   ├── names/
│   │   ├── abraham.png
│   │   ├── moses.png
│   │   ├── david.png
│   │   ├── default.png (fallback)
│   │   └── ... (50,000 images)
│   ├── situations/
│   │   ├── anxiety.svg
│   │   ├── joy.svg
│   │   └── ... (1,000 images)
│   ├── professions/
│   │   ├── teacher.png
│   │   ├── doctor.png
│   │   └── ... (500 images)
│   └── ui/
│       ├── logo.png
│       └── og-default.png
├── favicon.ico
└── robots.txt
```

## Next.js Image Component

### Configuration (next.config.ts)

```typescript
const nextConfig: NextConfig = {
  images: {
    // Enable modern formats (automatic conversion)
    formats: ['image/avif', 'image/webp'],

    // Define device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

    // Define image sizes for srcset
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Minimum cache time (1 year for immutable images)
    minimumCacheTTL: 31536000,

    // Remote patterns (if using external images)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.thelordwill.com',
        port: '',
        pathname: '/images/**',
      },
    ],
  },
};
```

### Benefits

- **Automatic Format Conversion:** PNG → AVIF/WebP based on browser support
- **Responsive Sizing:** Serves optimal image size per device
- **Lazy Loading:** Images load as user scrolls (except `priority` images)
- **Blur Placeholder:** Smooth loading experience
- **CDN Optimization:** Automatic integration with Vercel Image Optimization

## Usage Patterns

### 1. Biblical Name Pages

**Above-the-Fold (Hero Image):**
```tsx
import { BibleNameHero } from '@/components/bible-name-image';

<BibleNameHero
  name="moses"
  title="Moses"
  description="Meaning: Drawn out of water"
  // priority=true (automatic in component)
/>
```

**In-Content Images:**
```tsx
import { BibleNameImage } from '@/components/bible-name-image';

<BibleNameImage
  name="aaron"
  size="md"
  alt="Aaron, brother of Moses"
  priority={false} // Lazy load
/>
```

### 2. Category/Hub Pages (Grid Layouts)

```tsx
import { BibleNameGrid } from '@/components/bible-name-image';

<BibleNameGrid
  names={[
    { slug: 'abraham', name: 'Abraham' },
    { slug: 'isaac', name: 'Isaac' },
    { slug: 'jacob', name: 'Jacob' },
    // ... 100+ names
  ]}
  imageSize="sm"
/>
```

### 3. Situation Pages (SVG Icons)

```tsx
import Image from 'next/image';

<Image
  src="/images/situations/anxiety.svg"
  alt="Anxiety icon"
  width={64}
  height={64}
  className="text-primary"
/>
```

### 4. OpenGraph Images (Dynamic)

**API Route:** `/app/api/og/route.tsx`

```tsx
import { ImageResponse } from 'next/og';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>
        <h1>{name}</h1>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

**Usage in metadata:**
```tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const { name } = await params;
  const imageUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/og?name=${encodeURIComponent(name)}`;

  return {
    openGraph: {
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
  };
}
```

## Image Sourcing Strategy

### Phase 1: Placeholder Images (Launch)

- **Default Images:** Use generic biblical illustrations
- **SVG Icons:** Create simple, semantic icons for situations
- **Total Files:** ~50 unique images, reused across pages

### Phase 2: AI-Generated Art (Post-Launch)

- **Tool:** Midjourney, DALL-E, or Stable Diffusion
- **Prompt Template:**
  ```
  Biblical character illustration of {name}, {description},
  historically accurate clothing, Middle Eastern setting,
  professional digital art, warm tones, 4K quality
  ```
- **Batch Generation:** 1,000 images/week
- **Review:** Manual approval for theological accuracy

### Phase 3: Professional Artwork (Scale)

- **Commission:** Artists on Fiverr/Upwork
- **Style Guide:** Consistent visual identity
- **License:** Full commercial rights

### Phase 4: Community Contributions (Future)

- **User Uploads:** Verified artists submit illustrations
- **Attribution:** Credit original creators
- **Quality Control:** Editorial review process

## Performance Optimization

### Image Sizing Guidelines

| Size Variant | Dimensions | Use Case | File Size Target |
|--------------|------------|----------|------------------|
| `sm`         | 120x120px  | Thumbnails, grids | < 10 KB |
| `md`         | 240x240px  | In-content images | < 25 KB |
| `lg`         | 400x400px  | Featured images | < 50 KB |
| `xl`         | 600x600px  | Hero images | < 100 KB |

### Compression Settings

**Source Images (before upload):**
- **PNG:** TinyPNG or ImageOptim (80-90% quality)
- **JPEG:** 85% quality, progressive encoding
- **SVG:** SVGO optimization

**Next.js Automatic Compression:**
- **AVIF:** ~50% smaller than WebP
- **WebP:** ~30% smaller than PNG/JPEG
- **Quality:** 75 (default), adjustable per image

### Lazy Loading Strategy

```tsx
// Above-the-fold (loads immediately)
<BibleNameImage name="moses" priority />

// Below-the-fold (lazy loads)
<BibleNameImage name="aaron" /> // priority defaults to false

// Preload critical images
<link rel="preload" as="image" href="/images/names/moses.png" />
```

### Responsive Breakpoints

```tsx
<Image
  src="/images/names/abraham.png"
  alt="Abraham"
  width={600}
  height={600}
  sizes="
    (max-width: 640px) 120px,
    (max-width: 1024px) 240px,
    400px
  "
/>
```

**Result:** Mobile users download 120px image, desktop users get 400px.

## CDN and Caching

### Vercel Image Optimization (Recommended)

- **Automatic:** Works out-of-the-box
- **Edge Caching:** Images cached globally
- **Bandwidth:** First 1 GB free, then $0.40/GB

### Custom CDN (Cloudflare, CloudFront)

**Setup:**
1. Upload images to S3/R2/Spaces
2. Configure CDN with custom domain
3. Update `next.config.ts`:

```typescript
images: {
  loader: 'custom',
  loaderFile: './lib/image-loader.ts',
}
```

**Custom Loader (`lib/image-loader.ts`):**
```typescript
export default function cloudflareLoader({ src, width, quality }) {
  const params = [`width=${width}`];
  if (quality) {
    params.push(`quality=${quality}`);
  }
  return `https://cdn.thelordwill.com/${src}?${params.join('&')}`;
}
```

### Cache Headers

```typescript
// app/images/[...path]/route.ts
export async function GET(request: Request) {
  // ... fetch image

  return new Response(imageBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
```

## Fallback Strategy

### Missing Images

```tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';

export function BibleNameImageWithFallback({ name, size = 'md' }) {
  const [imgSrc, setImgSrc] = useState(`/images/names/${name}.png`);

  return (
    <Image
      src={imgSrc}
      alt={name}
      width={240}
      height={240}
      onError={() => {
        setImgSrc('/images/names/default.png'); // Fallback
      }}
    />
  );
}
```

### Default Images

- **Names:** `/images/names/default.png` (scroll/quill icon)
- **Situations:** `/images/situations/default.svg` (heart/hands icon)
- **Professions:** `/images/professions/default.png` (tools icon)

## SEO Considerations

### Alt Text Best Practices

```tsx
// Good
<Image alt="Moses parting the Red Sea - Biblical illustration" />

// Bad
<Image alt="moses.png" />
<Image alt="" /> // Empty alt (only if decorative)
```

### Image Sitemaps

**Generate image sitemap:**
```xml
<!-- /sitemap-images.xml -->
<url>
  <loc>https://thelordwill.com/meaning-of-moses-in-the-bible</loc>
  <image:image>
    <image:loc>https://thelordwill.com/images/names/moses.png</image:loc>
    <image:title>Moses - Drawn out of water</image:title>
    <image:caption>Biblical illustration of Moses</image:caption>
  </image:image>
</url>
```

### Structured Data

```json
{
  "@type": "Article",
  "image": {
    "@type": "ImageObject",
    "url": "https://thelordwill.com/images/names/moses.png",
    "width": 600,
    "height": 600
  }
}
```

## Accessibility

### ARIA Labels

```tsx
<div role="img" aria-label="Moses parting the Red Sea">
  <Image src="/images/names/moses.png" alt="" />
</div>
```

### Decorative Images

```tsx
// Purely decorative (hide from screen readers)
<Image src="/decorative.png" alt="" role="presentation" />
```

### Focus States

```tsx
<button className="focus:ring-2 focus:ring-primary">
  <Image src="/icon.png" alt="Search icon" />
</button>
```

## Monitoring

### Key Metrics

1. **Largest Contentful Paint (LCP):**
   - Target: < 2.5s
   - Monitor: Name page hero images

2. **Cumulative Layout Shift (CLS):**
   - Target: < 0.1
   - Always specify width/height on images

3. **Image Loading Time:**
   - Target: < 500ms for above-the-fold
   - Use `priority` attribute

### Analytics

**Track image performance:**
```typescript
// lib/analytics.ts
export function trackImageLoad(imageName: string, loadTime: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'image_load', {
      image_name: imageName,
      load_time: loadTime,
      page_path: window.location.pathname,
    });
  }
}
```

**Usage:**
```tsx
<Image
  src="/images/names/moses.png"
  onLoadingComplete={(result) => {
    if (result.naturalWidth) {
      trackImageLoad('moses', performance.now());
    }
  }}
/>
```

## Troubleshooting

### Issue: Slow Image Loading

**Symptoms:** LCP > 3s, images visible late

**Solutions:**
1. Use `priority` for above-the-fold images
2. Reduce source image file size (< 100 KB)
3. Enable AVIF format
4. Preload critical images

### Issue: Layout Shift

**Symptoms:** CLS > 0.1, content jumps

**Solutions:**
```tsx
// Always specify dimensions
<Image width={600} height={600} />

// Or use fill with aspect ratio
<div className="relative aspect-square">
  <Image fill className="object-cover" />
</div>
```

### Issue: Images Not Loading

**Symptoms:** 404 errors, broken images

**Solutions:**
1. Check file path (case-sensitive)
2. Verify image exists in `/public`
3. Check `next.config.ts` remotePatterns
4. Implement fallback images

## Deployment Checklist

- [ ] All images compressed (< 100 KB)
- [ ] Default fallback images created
- [ ] `next/image` used for all images (no `<img>`)
- [ ] Priority set for above-the-fold images
- [ ] Alt text provided for all images
- [ ] Responsive sizes configured
- [ ] OpenGraph images generated
- [ ] Image sitemap created
- [ ] CDN configured (if using custom)
- [ ] LCP < 2.5s verified in production

## Resources

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Web.dev Image Best Practices](https://web.dev/fast/#optimize-your-images)
- [AVIF vs WebP Comparison](https://jakearchibald.com/2020/avif-has-landed/)
- [Core Web Vitals](https://web.dev/vitals/)

---

**Last Updated:** 2026-01-05
**Implementation Status:** Phase 1 (Placeholder Images)
