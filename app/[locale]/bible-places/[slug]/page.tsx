import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCanonicalUrl } from "@/lib/utils";
import { getPlaceBySlug, formatPlaceVerseReference } from "@/lib/db/place-queries";
import { TourLeadForm } from "@/components/tour-lead-form";
import { EEATStrip } from "@/components/eeat-strip";
import { buildBreadcrumbList, buildPlaceEntitySchema } from "@/lib/seo/jsonld";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RelatedSection } from "@/components/related-section";
import { getRelatedLinks } from "@/lib/internal-linking";
import { isValidLocale, type Locale, DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { buildAlternates } from "@/lib/i18n/links";
import { LocaleFallbackBanner, getFallbackRobotsMeta } from "@/components/locale-fallback-banner";
import { localizedField } from "@/lib/i18n/translation-utils";
import { BlueprintFallback } from "@/components/blueprint-fallback";
import { getBlueprintForRoute } from "@/lib/blueprints";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

type PlaceResult = Awaited<ReturnType<typeof getPlaceBySlug>>;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  if (!isValidLocale(locale)) {
    return {};
  }

  let place: PlaceResult | null = null;
  try {
    place = await getPlaceBySlug(slug, 20);
  } catch (error) {
    console.error("Place metadata query failed:", error);
  }

  const blueprintFallback =
    getBlueprintForRoute("places", slug, locale) ??
    getBlueprintForRoute("places", "list", locale);

  if (!place || place.status !== "published") {
    return {
      title: blueprintFallback?.title ?? `Bible Place: ${slug}`,
      description: blueprintFallback?.description ?? `Details about ${slug} are coming soon.`,
      alternates: {
        canonical: getCanonicalUrl(`/bible-places/${slug}`),
      },
      robots: getFallbackRobotsMeta(locale, blueprintFallback !== undefined),
    };
  }

  const titleFallback = `${place.name} in the Bible - Scriptures & Holy Land Tours`;
  const descriptionFallback = `Discover ${place.name} in the Bible: ${place.description?.substring(0, 150) ?? ""}... Explore verses mentioning this sacred location.`;
  const localizedTitle = localizedField(
    place.metaTitle ?? titleFallback,
    place.metaTitleTranslations,
    locale,
    titleFallback,
  );
  const localizedDescription = localizedField(
    place.metaDescription ?? descriptionFallback,
    place.metaDescriptionTranslations,
    locale,
    descriptionFallback,
  );
  const alternates = buildAlternates(`/bible-places/${slug}`, locale);
  const isTranslated = locale === DEFAULT_LOCALE;
  const imageUrl = getCanonicalUrl(`/api/og?place=${encodeURIComponent(place.name)}&type=place`);

  return {
    title: localizedTitle,
    description: localizedDescription,
    alternates,
    robots: getFallbackRobotsMeta(locale, isTranslated),
    openGraph: {
      title: localizedTitle,
      description: localizedDescription,
      url: getCanonicalUrl(`/bible-places/${slug}`),
      type: "article",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: `${place.name} in the Bible` }],
      siteName: "The Lord Will",
    },
    twitter: {
      card: "summary_large_image",
      title: localizedTitle,
      description: localizedDescription,
      images: [imageUrl],
    },
    keywords: [
      `${place.name} in the Bible`,
      `${place.name} biblical significance`,
      `Holy Land tour ${place.name}`,
      "Bible places",
      "Biblical geography",
    ],
  };
}

export default async function LocalePlacePage({ params }: PageProps) {
  const { locale: localeParam, slug } = await params;

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const isTranslated = locale === DEFAULT_LOCALE;

  let place: PlaceResult | null = null;
  try {
    place = await getPlaceBySlug(slug, 20);
  } catch (error) {
    console.error("Place detail query failed:", error);
  }

  if (!place || place.status !== "published") {
    return renderPlaceFallback(locale, slug);
  }

  const relatedLinks = await getRelatedLinks("place", {
    id: place.id,
    slug: place.slug,
    name: place.name,
    region: place.region,
    country: place.country,
  });

  const localizedDescription = localizedField(
    place.description,
    place.descriptionTranslations,
    locale,
  );
  const localizedHistoricalInfo = localizedField(
    place.historicalInfo,
    place.historicalInfoTranslations,
    locale,
  );
  const localizedBiblicalContext = localizedField(
    place.biblicalContext,
    place.biblicalContextTranslations,
    locale,
  );

  const breadcrumbs = [
    { label: "Home", href: `/${locale}`, position: 1 },
    { label: "Bible Places", href: `/${locale}/bible-places`, position: 2 },
    { label: place.name, href: `/${locale}/bible-places/${slug}`, position: 3 },
  ];

  return (
    <>
      {!isTranslated && (
        <LocaleFallbackBanner locale={locale} currentPath={`/${locale}/bible-places/${slug}`} />
      )}

      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs items={breadcrumbs} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildBreadcrumbList(breadcrumbs, getCanonicalUrl("/"))),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              buildPlaceEntitySchema({
                id: place.id,
                slug: place.slug,
                name: place.name,
                description: place.description || `Biblical place: ${place.name}`,
                url: getCanonicalUrl(`/bible-places/${slug}`),
                imageUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://thelordwill.com"}/api/og/place/${slug}.png`,
                latitude: place.latitude,
                longitude: place.longitude,
                country: place.country,
                region: place.region,
                dateModifiedISO: new Date(place.updatedAt).toISOString().slice(0, 10),
                verseCount: place.verses.length,
              })
            ),
          }}
        />

        <div className="mt-6 mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{place.name} in the Bible</h1>

          <EEATStrip
            authorName="The Lord Will Editorial Team"
            reviewerName="Ugo Candido"
            reviewerCredential="Engineer"
            lastUpdatedISO={new Date(place.updatedAt).toISOString().slice(0, 10)}
            categoryLabel="Biblical Places"
          />

          <p className="text-xl text-gray-600 leading-relaxed">{localizedDescription}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
          {localizedBiblicalContext && (
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Biblical Significance</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{localizedBiblicalContext}</p>
              </div>
            </section>
          )}

          {localizedHistoricalInfo && (
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Historical Context</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{localizedHistoricalInfo}</p>
              </div>
            </section>
          )}

            {(place.latitude || place.country) && (
              <section className="mb-10 p-6 bg-blue-50 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Location Details</h3>
                <div className="space-y-2 text-gray-700">
                  {place.country && (
                    <p>
                      <strong>Country:</strong> {place.country}
                    </p>
                  )}
                  {place.region && (
                    <p>
                      <strong>Region:</strong> {place.region}
                    </p>
                  )}
                  {place.latitude && place.longitude && (
                    <p>
                      <strong>Coordinates:</strong> {place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}
                    </p>
                  )}
                </div>
              </section>
            )}

            {place.verses.length > 0 && (
              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Bible Verses About {place.name}</h2>
                <div className="space-y-6">
                  {place.verses.map((verse) => (
                    <div key={verse.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="mb-2">
                        <Link
                          href={`/${locale}/verse/${verse.bookId}/${verse.chapter}/${verse.verseNumber}`}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                        >
                          {formatPlaceVerseReference(verse.bookId, verse.chapter, verse.verseNumber)}
                        </Link>
                        {verse.mentionType && (
                          <span className="ml-2 text-xs text-gray-500 italic">({verse.mentionType})</span>
                        )}
                      </div>
                      <p className="text-gray-800 leading-relaxed">{verse.textKjv || verse.textWeb || "Text not available"}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {place.relatedPlaces.length > 0 && (
              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Nearby Biblical Locations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {place.relatedPlaces.map((relatedPlace) => (
                    <Link
                      key={relatedPlace.id}
                      href={`/${locale}/bible-places/${relatedPlace.slug}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                    >
                      <h3 className="font-semibold text-gray-900 mb-2">{relatedPlace.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{relatedPlace.description}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    How long should I spend visiting {place.name}?
                  </h3>
                  <p className="text-gray-700">
                    Most guided tours allocate 1-2 hours for {place.name}, allowing time for exploration, reflection, and
                    photography. Private tours can be customized to spend more time.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    What is the best time to visit {place.name}?
                  </h3>
                  <p className="text-gray-700">
                    Spring (March-May) and fall (September-November) offer ideal weather for visiting the Holy Land.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Can I visit {place.name} on a Christian pilgrimage tour?
                  </h3>
                  <p className="text-gray-700">
                    Yes. {place.name} is included in many Christian pilgrimage itineraries.
                  </p>
                </div>
              </div>
            </section>

            {relatedLinks.length > 0 && (
              <RelatedSection title="Related Content" links={relatedLinks} />
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <TourLeadForm placeName={place.name} placeSlug={place.slug} contextSlug={place.slug} contextType="place" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function renderPlaceFallback(locale: Locale, slug: string) {
  const blueprintFallback =
    getBlueprintForRoute("places", slug, locale) ??
    getBlueprintForRoute("places", "list", locale);

  return (
    <>
      {locale !== DEFAULT_LOCALE && (
        <LocaleFallbackBanner locale={locale} currentPath={`/${locale}/bible-places/${slug}`} />
      )}
      <main className="min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <BlueprintFallback
            blueprint={blueprintFallback}
            title={`Bible Place: ${slug}`}
            description="Detailed content coming soon."
            fallbackContent="<p>We're preparing this place page to include verses, prayer prompts, and pilgrimage guidance.</p>"
          />
        </div>
      </main>
    </>
  );
}
