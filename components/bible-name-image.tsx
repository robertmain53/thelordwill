import Image from 'next/image';

interface BibleNameImageProps {
  /**
   * The biblical name (slug format, e.g., "abraham", "moses")
   */
  name: string;

  /**
   * Display size variant
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Alternative text (defaults to name)
   */
  alt?: string;

  /**
   * Loading priority (use for above-the-fold images)
   */
  priority?: boolean;

  /**
   * Optional CSS classes
   */
  className?: string;
}

/**
 * Get image dimensions based on size variant
 */
function getImageDimensions(size: BibleNameImageProps['size']) {
  switch (size) {
    case 'sm':
      return { width: 120, height: 120 };
    case 'md':
      return { width: 240, height: 240 };
    case 'lg':
      return { width: 400, height: 400 };
    case 'xl':
      return { width: 600, height: 600 };
    default:
      return { width: 240, height: 240 };
  }
}

/**
 * Get image path for biblical name
 * Priority:
 * 1. Custom artwork: /images/names/[name].png
 * 2. Category default: /images/names/default-[category].png
 * 3. Global fallback: /images/names/default.png
 */
export function getNameImagePath(name: string): string {
  // In production, you would check if custom image exists
  // For now, return expected path
  return `/images/names/${name}.png`;
}

/**
 * Optimized Image Component for Biblical Names
 *
 * Features:
 * - Automatic AVIF/WebP conversion
 * - Responsive sizing
 * - Lazy loading by default (unless priority=true)
 * - Blur placeholder for better UX
 * - SEO-friendly alt text
 *
 * Usage:
 * ```tsx
 * <BibleNameImage name="moses" size="lg" priority />
 * ```
 */
export function BibleNameImage({
  name,
  size = 'md',
  alt,
  priority = false,
  className = '',
}: BibleNameImageProps) {
  const { width, height } = getImageDimensions(size);
  const imagePath = getNameImagePath(name);
  const altText = alt || `Biblical illustration for ${name}`;

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <Image
        src={imagePath}
        alt={altText}
        width={width}
        height={height}
        priority={priority}
        placeholder="blur"
        blurDataURL={`data:image/svg+xml;base64,${generateBlurPlaceholder(width, height)}`}
        className="object-cover"
        sizes={`
          (max-width: 640px) ${width * 0.5}px,
          (max-width: 1024px) ${width * 0.75}px,
          ${width}px
        `}
      />
    </div>
  );
}

/**
 * Generate SVG blur placeholder for better perceived performance
 */
function generateBlurPlaceholder(width: number, height: number): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(229,231,235);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(209,213,219);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)" />
    </svg>
  `;

  return Buffer.from(svg).toString('base64');
}

/**
 * Responsive Name Image Grid (for category pages)
 */
interface BibleNameGridProps {
  names: Array<{ slug: string; name: string }>;
  imageSize?: BibleNameImageProps['size'];
}

export function BibleNameGrid({ names, imageSize = 'sm' }: BibleNameGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {names.map((item) => (
        <div key={item.slug} className="flex flex-col items-center gap-2">
          <BibleNameImage name={item.slug} size={imageSize} />
          <span className="text-sm font-medium text-center">{item.name}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Hero Image Component (for main name pages)
 */
interface BibleNameHeroProps {
  name: string;
  title: string;
  description?: string;
}

export function BibleNameHero({ name, title, description }: BibleNameHeroProps) {
  return (
    <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-xl">
      <Image
        src={getNameImagePath(name)}
        alt={`${title} - Biblical Name Illustration`}
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
        <h1 className="text-4xl md:text-6xl font-bold mb-2">{title}</h1>
        {description && (
          <p className="text-lg md:text-xl text-white/90">{description}</p>
        )}
      </div>
    </div>
  );
}
