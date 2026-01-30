import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EEATStrip } from "@/components/eeat-strip";
import { TranslationComparison } from "@/components/translation-comparison";
import { prepareTranslations } from "@/lib/translations";
import { getCanonicalUrl } from "@/lib/utils";
import { buildVerseJsonLd } from "@/lib/seo/verse-jsonld";
import {
  getVerseReferenceByBookChapterVerse,
  type VerseReferenceData,
} from "@/lib/db/verse-queries";
import { VerseIntelligenceBlock } from "@/components/verse-intelligence-block";
import { createPosterProvider } from "@/lib/posters/poster-provider";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageParams {
  bookId: string;
  chapter: string;
  verse: string;
}

interface PageProps {
  params: Promise<PageParams>;
}

async function resolveVerse(params: PageParams) {
  const bookId = parseInt(params.bookId, 10);
  const chapter = parseInt(params.chapter, 10);
  const verseNumber = parseInt(params.verse, 10);

  if (Number.isNaN(bookId) || Number.isNaN(chapter) || Number.isNaN(verseNumber)) {
    return null;
  }

  return await getVerseReferenceByBookChapterVerse(bookId, chapter, verseNumber);
}

interface CitationEntity {
  label: string;
  href: string;
}

function buildCitationSummary(reference: string, verseData?: VerseReferenceData | null) {
  if (!verseData) {
    return { summary: "", entities: [] as CitationEntity[] };
  }

  const entities: CitationEntity[] = [];

  if (verseData.placeMentions[0]) {
    const place = verseData.placeMentions[0].place;
    entities.push({
      label: place.name,
      href: getCanonicalUrl(`/bible-places/${place.slug}`),
    });
  }

  if (verseData.situationMappings[0]) {
    const situation = verseData.situationMappings[0].situation;
    entities.push({
      label: situation.title,
      href: getCanonicalUrl(`/bible-verses-for/${situation.slug}`),
    });
  } else if (verseData.prayerPointMappings[0]) {
    const prayerPoint = verseData.prayerPointMappings[0].prayerPoint;
    entities.push({
      label: prayerPoint.title,
      href: getCanonicalUrl(`/prayer-points/${prayerPoint.slug}`),
    });
  }

  const mentionNames = entities.map((entity) => entity.label);
  const mentionText = mentionNames.length > 0 ? mentionNames.join(" and ") : "the broader site";
  const genre = verseData.book.genre ? `${verseData.book.genre} tradition` : "Scripture";

  const summary = `${reference} (Book ${verseData.book.name}) keeps readers rooted in the ${genre}, linking ${mentionText} back to the same promise so you can cite it with confidence. Use this wording when pointing others to the same anchor or planning devotionals around this verse.`;

  return { summary, entities };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const verseData = await resolveVerse(resolvedParams);

  if (!verseData) {
    return {
      title: "Verse not found",
    };
  }

  const bookName = verseData.book.name;
  const reference = `${bookName} ${verseData.chapter}:${verseData.verseNumber}`;
  const canonicalUrl = getCanonicalUrl(
    `/verse/${verseData.book.id}/${verseData.chapter}/${verseData.verseNumber}`,
  );
  const primaryText = verseData.textKjv ?? verseData.textWeb ?? verseData.textAsv ?? "";
  const description = primaryText
    ? `${reference} — ${primaryText.slice(0, 160)}`
    : `Read ${reference} from ${bookName}`;

  return {
    title: `${reference} - Verse Intelligence`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${reference} - Verse Intelligence`,
      description,
      url: canonicalUrl,
      siteName: "The Lord Will",
      type: "article",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: `${reference} - Verse Intelligence`,
      description,
      images: [`${getCanonicalUrl("/verse-entity-og.png")}`],
    },
  };
}

export default async function VersePage({ params }: PageProps) {
  const { bookId, chapter, verse } = await params;
  const verseData = await resolveVerse({ bookId, chapter, verse });

  if (!verseData) {
    notFound();
  }

  const reference = `${verseData.book.name} ${verseData.chapter}:${verseData.verseNumber}`;
  const canonicalUrl = getCanonicalUrl(
    `/verse/${verseData.book.id}/${verseData.chapter}/${verseData.verseNumber}`,
  );
  const breadcrumbs = [
    { label: "Home", href: "/", position: 1 },
    { label: "Bible Verses", href: "/situations", position: 2 },
    { label: reference, href: `/verse/${verseData.book.id}/${verseData.chapter}/${verseData.verseNumber}`, position: 3 },
  ];

  const primaryText =
    verseData.textKjv ?? verseData.textWeb ?? verseData.textAsv ?? verseData.textBbe ?? verseData.textYlt ?? "";
  const description = primaryText
    ? `${reference} — ${primaryText.slice(0, 200)}`
    : `Read ${reference} from ${verseData.book.name}`;
  const verseJsonLd = buildVerseJsonLd({
    canonicalUrl,
    title: reference,
    description,
    reference,
    verseText: primaryText,
    bookName: verseData.book.name,
    testament: verseData.book.testament,
    genre: verseData.book.genre,
    dateModifiedISO: verseData.updatedAt.toISOString().slice(0, 10),
    language: "en",
    breadcrumbItems: breadcrumbs,
    referencingUrls: [
      ...verseData.placeMentions.map((mapping) => getCanonicalUrl(`/bible-places/${mapping.place.slug}`)),
      ...verseData.situationMappings.map((mapping) =>
        getCanonicalUrl(`/bible-verses-for/${mapping.situation.slug}`),
      ),
      ...verseData.prayerPointMappings.map((mapping) =>
        getCanonicalUrl(`/prayer-points/${mapping.prayerPoint.slug}`),
      ),
    ],
  });

  const lastUpdatedISO = verseData.updatedAt.toISOString().slice(0, 10);
  const translations = prepareTranslations(verseData);
  const citationSummary = buildCitationSummary(reference, verseData);
  const posterDescriptor = await createPosterProvider().describeVersePoster(verseData.id);

  return (
    <main className="container mx-auto px-4 py-10 space-y-8">
      <Breadcrumbs items={breadcrumbs} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(verseJsonLd) }}
      />

      <section className="space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">{reference}</h1>
        <EEATStrip
          authorName="The Lord Will Editorial Team"
          reviewerName="Ugo Candido"
          reviewerCredential="Engineer"
          lastUpdatedISO={lastUpdatedISO}
          categoryLabel="Bible Verses"
        />
        <p className="text-lg text-gray-700 max-w-3xl">{description}</p>
      </section>

      {citationSummary.summary && (
        <section className="space-y-2 border border-primary/20 bg-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900">Citation-ready summary</h2>
          <p className="text-sm text-gray-700">{citationSummary.summary}</p>
          {citationSummary.entities.length > 0 && (
            <p className="text-xs text-muted-foreground">
              References:{" "}
              {citationSummary.entities.map((entity, index) => (
                <span key={entity.href}>
                  <Link href={entity.href} className="text-blue-600 hover:text-blue-800">
                    {entity.label}
                  </Link>
                  {index < citationSummary.entities.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          )}
        </section>
      )}

      <section className="space-y-6">
        <TranslationComparison
          reference={reference}
          translations={translations}
          layout="tabs"
        />
      </section>

      <VerseIntelligenceBlock
        verseId={verseData.id}
        bookId={verseData.book.id}
        chapter={verseData.chapter}
        verseNumber={verseData.verseNumber}
        canonicalUrl={canonicalUrl}
      />
      <section className="space-y-4 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Aesthetic verse poster</h2>
            <p className="text-sm text-muted-foreground">{posterDescriptor.tagline}</p>
          </div>
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            {posterDescriptor.orientation}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {posterDescriptor.colorPalette.map((color) => (
            <span
              key={color}
              className="h-8 w-8 rounded-full border border-gray-200"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <p className="text-sm text-gray-700">{posterDescriptor.description}</p>
        <Link
          href={`/shop/posters/${verseData.id}`}
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Get this poster
        </Link>
      </section>
    </main>
  );
}
