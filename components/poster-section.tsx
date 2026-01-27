/**
 * Poster Section Component
 * Displays verse poster preview with Etsy purchase link
 */

import Image from "next/image";
import Link from "next/link";
import { buildSituationPosterUrl, getEtsyAttribution } from "@/lib/commerce/etsy";

interface PosterSectionProps {
  posterUrl: string;
  situationTitle: string;
  verseRef: string;
  verseText: string;
}

export function PosterSection({
  posterUrl,
  situationTitle,
  verseRef,
  verseText,
}: PosterSectionProps) {
  const etsyUrl = buildSituationPosterUrl(situationTitle, verseRef);

  return (
    <section className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-6 md:p-8">
      <div className="flex flex-col md:flex-row gap-6 items-center">
        {/* Poster Preview */}
        <div className="flex-shrink-0 w-full md:w-auto">
          <div className="relative w-full md:w-[200px] aspect-[3/4] rounded-lg overflow-hidden shadow-lg border border-amber-300 dark:border-amber-700 bg-white">
            <Image
              src={posterUrl}
              alt={`${verseRef} verse poster`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 200px"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-2">
            Verse Poster: {verseRef}
          </h3>
          <p className="text-amber-800 dark:text-amber-200 text-sm mb-4 line-clamp-3">
            "{verseText}"
          </p>
          <p className="text-amber-700 dark:text-amber-300 text-sm mb-4">
            Beautiful wall art featuring this powerful Scripture verse. Perfect for home,
            office, or as a meaningful gift.
          </p>

          {/* Etsy Button */}
          <Link
            href={etsyUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#F56400] hover:bg-[#D45600] text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            <EtsyIcon />
            <span>{getEtsyAttribution()}</span>
          </Link>

          <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
            Affiliate link - we may earn a commission at no extra cost to you
          </p>
        </div>
      </div>
    </section>
  );
}

function EtsyIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8.559 5.586v4.97c.129.022.559.071 1.078.071 1.606 0 2.682-.535 2.862-2.145.075-.7.036-1.515.036-2.322v-.622l-3.976.048zm0 7.27v4.658c0 .693.035 1.354-.039 1.977-.148 1.215-.929 1.841-2.281 1.841h-.71c-.633 0-1.122-.036-1.529-.107V7.314c0-1.465-.053-2.648-.09-3.54-.018-.446-.027-.844-.027-1.197l.027-.75H4.27c.598-.024 1.225-.047 1.922-.067.697-.02 1.383-.038 2.059-.053.675-.016 1.311-.029 1.906-.04s1.102-.016 1.521-.016c.778 0 1.527.033 2.246.098s1.327.219 1.824.459c.496.24.893.573 1.189.999.297.426.445.979.445 1.661 0 1.025-.352 1.88-1.057 2.561-.707.684-1.632 1.159-2.779 1.426v.07c1.383.176 2.455.617 3.215 1.324.761.708 1.141 1.686 1.141 2.934 0 1.641-.623 2.931-1.869 3.869-1.248.939-3.076 1.408-5.486 1.408-.455 0-.936-.013-1.443-.036-.508-.023-1.02-.056-1.537-.096s-1.012-.084-1.482-.132c-.471-.047-.877-.092-1.217-.132l-.072-1.018c-.012-.195-.02-.389-.023-.582v-6.486l4.307-.04-.001.07z" />
    </svg>
  );
}

/**
 * Server component wrapper that fetches poster URL
 */
interface PosterSectionServerProps {
  slug: string;
  situationTitle: string;
  verseRef: string;
  verseText: string;
}

export async function PosterSectionServer({
  slug,
  situationTitle,
  verseRef,
  verseText,
}: PosterSectionServerProps) {
  const { getPosterUrl } = await import("@/lib/posters/provider");

  const posterUrl = await getPosterUrl({
    type: "situation",
    slug,
    verseRef,
    verseText,
  });

  return (
    <PosterSection
      posterUrl={posterUrl}
      situationTitle={situationTitle}
      verseRef={verseRef}
      verseText={verseText}
    />
  );
}
