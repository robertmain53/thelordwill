import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCanonicalUrl } from "@/lib/utils";
import { getPlaceBySlug, formatPlaceVerseReference } from "@/lib/db/place-queries";
import { TourLeadForm } from "@/components/tour-lead-form";
import { EEATStrip } from "@/components/eeat-strip";
import { buildBreadcrumbList, buildPlaceEntitySchema } from "@/lib/seo/jsonld";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RelatedSection } from "@/components/related-section";
import { getRelatedLinks } from "@/lib/internal-linking";
import { getGraphLinkSet } from "@/lib/internal-linking/graph";
import Link from "next/link";
import { RelatedResourcesSection } from "@/components/related-resources-section";
import { VerseIntelligenceBlock } from "@/components/verse-intelligence-block";

// Force SSR - disable static generation
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

type PlaceResult = Awaited<ReturnType<typeof getPlaceBySlug>>;

// Centralized publish-gate (prevents draft leakage)
function assertPublished(place: PlaceResult): asserts place is NonNullable<PlaceResult> {
  if (!place) notFound();

  // Double-check status field for fail-closed safety
  if (place.status !== "published") {
    notFound();
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const place = await getPlaceBySlug(slug, 20);
  // Fail closed: draft/unknown status => not found for metadata too.
  assertPublished(place);

  const title = `${place.name} in the Bible - Scriptures & Holy Land Tours`;
  const description = `Discover ${place.name} in the Bible: ${place.description.substring(
    0,
    150,
  )}... Explore verses mentioning this sacred location and plan your Christian pilgrimage.`;
  const canonicalUrl = getCanonicalUrl(`/bible-places/${slug}`);
  const imageUrl = getCanonicalUrl(
    `/api/og?place=${encodeURIComponent(place.name)}&type=place`,
  );

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "article",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${place.name} in the Bible`,
        },
      ],
      siteName: "The Lord Will",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    keywords: [
      `${place.name} in the Bible`,
      `${place.name} biblical significance`,
      `${place.name} scripture`,
      `Holy Land tour ${place.name}`,
      `Christian pilgrimage ${place.name}`,
      "Bible places",
      "Biblical geography",
      "Israel tours",
    ],
  };
}

export default async function PlacePage({ params }: PageProps) {
  const { slug } = await params;

  const place = await getPlaceBySlug(slug, 20);
  // Fail closed: do not render drafts
  assertPublished(place);

  // Get deterministic related links based on DB relations
  const relatedLinks = await getRelatedLinks("place", {
    id: place.id,
    slug: place.slug,
    name: place.name,
    region: place.region,
    country: place.country,
  });
  const primaryVerse = place.verses[0] ?? null;
  const primaryCanonicalUrl = primaryVerse
    ? getCanonicalUrl(
        `/verse/${primaryVerse.bookId}/${primaryVerse.chapter}/${primaryVerse.verseNumber}`
      )
    : null;

  const verseRows = place.verses.map((verse) => ({
    reference: formatPlaceVerseReference(verse.bookId, verse.chapter, verse.verseNumber),
    bookId: verse.bookId,
    chapter: verse.chapter,
    verseNumber: verse.verseNumber,
    relevanceScore: verse.relevanceScore,
    snippet: verse.textKjv || verse.textWeb || undefined,
  }));

  const graphLinks = await getGraphLinkSet({
    entityType: "place",
    record: {
      id: place.id,
      slug: place.slug,
      name: place.name,
      region: place.region,
      country: place.country,
    },
    verseRows,
    precomputedEntityLinks: relatedLinks,
  });

  const breadcrumbs = [
    { label: "Home", href: "/", position: 1 },
    { label: "Bible Places", href: "/bible-places", position: 2 },
    { label: place.name, href: `/bible-places/${slug}`, position: 3 },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={breadcrumbs} />

      {/* Structured data: Article + BreadcrumbList + Place */}
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
            }),
          ),
        }}
      />

      {/* Hero Section */}
      <div className="mt-6 mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{place.name} in the Bible</h1>

        <EEATStrip
          authorName="The Lord Will Editorial Team"
          reviewerName="Ugo Candido"
          reviewerCredential="Engineer"
          lastUpdatedISO={new Date(place.updatedAt).toISOString().slice(0, 10)}
          categoryLabel="Biblical Places"
        />

        <p className="text-xl text-gray-600 leading-relaxed">{place.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Biblical Context */}
          {place.biblicalContext && (
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Biblical Significance</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{place.biblicalContext}</p>
              </div>
            </section>
          )}

          {/* Historical Information */}
          {place.historicalInfo && (
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Historical Context</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{place.historicalInfo}</p>
              </div>
            </section>
          )}

          {/* Location Information */}
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

          {/* Bible Verses Mentioning This Place */}
          {place.verses.length > 0 && (
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Bible Verses About {place.name}</h2>
              <div className="space-y-6">
                {place.verses.map((verse) => {
                  const verseReference = formatPlaceVerseReference(
                    verse.bookId,
                    verse.chapter,
                    verse.verseNumber,
                  );
                  const verseCanonicalUrl = getCanonicalUrl(
                    `/verse/${verse.bookId}/${verse.chapter}/${verse.verseNumber}`,
                  );
                  return (
                    <div key={verse.id} className="border-l-4 border-blue-500 pl-4 py-2 space-y-3">
                      <div className="mb-2">
                        <Link
                          href={`/verse/${verse.bookId}/${verse.chapter}/${verse.verseNumber}`}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                        >
                          {verseReference}
                        </Link>
                        {verse.mentionType && (
                          <span className="ml-2 text-xs text-gray-500 italic">
                            ({verse.mentionType})
                          </span>
                        )}
                      </div>
                      <p className="text-gray-800 leading-relaxed">
                        {verse.textKjv || verse.textWeb || "Text not available"}
                      </p>
                      <div className="space-y-2">
                        <VerseIntelligenceBlock
                          verseId={verse.id}
                          bookId={verse.bookId}
                          chapter={verse.chapter}
                          verseNumber={verse.verseNumber}
                          canonicalUrl={verseCanonicalUrl}
                          variant="compact"
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span>
                          {verseReference} is part of this place&apos;s verse network.
                        </span>
                        <Link
                          href={verseCanonicalUrl}
                          className="text-blue-600 hover:text-blue-800"
                          aria-label={`View verse entity for ${verseReference}`}
                        >
                          View verse entity
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {primaryVerse && primaryCanonicalUrl && (
            <section className="mb-10">
              <VerseIntelligenceBlock
                verseId={primaryVerse.id}
                bookId={primaryVerse.bookId}
                chapter={primaryVerse.chapter}
                verseNumber={primaryVerse.verseNumber}
                canonicalUrl={primaryCanonicalUrl}
              />
            </section>
          )}

          {/* Related Places */}
          {place.relatedPlaces.length > 0 && (
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Nearby Biblical Locations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {place.relatedPlaces.map((relatedPlace) => (
                  <Link
                    key={relatedPlace.id}
                    href={`/bible-places/${relatedPlace.slug}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">{relatedPlace.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{relatedPlace.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* FAQ Section */}
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
                  Spring (March-May) and fall (September-November) offer ideal weather for visiting the Holy Land. Early
                  morning visits typically have fewer crowds and better lighting for photos.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can I visit {place.name} on a Christian pilgrimage tour?
                </h3>
                <p className="text-gray-700">
                  Yes. {place.name} is included in many Christian pilgrimage itineraries. Use the form to connect with
                  experienced tour operators who can create a personalized journey.
                </p>
              </div>
            </div>
          </section>

          {/* Related Content Section - Deterministic Internal Linking */}
          {relatedLinks.length > 0 && (
            <RelatedSection title="Related Content" links={relatedLinks} />
          )}

          <RelatedResourcesSection
            verseLinks={graphLinks.verseLinks}
            entityLinks={graphLinks.entityLinks}
          />
        </div>

        {/* Sidebar - Tour Lead Form (Sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <TourLeadForm placeName={place.name} placeSlug={place.slug} contextSlug={place.slug} contextType="place" />
          </div>
        </div>
      </div>
    </div>
  );
}
