import { getCanonicalUrl } from "@/lib/utils";
import { getCachedVerseIntelligence } from "@/lib/cache/verse-intelligence-cache";
import Link from "next/link";

type Variant = "full" | "compact";

interface VerseIntelligenceBlockProps {
  verseId: number;
  bookId: number;
  canonicalUrl: string;
  variant?: Variant;
}

export async function VerseIntelligenceBlock({
  verseId,
  bookId,
  canonicalUrl,
  variant = "full",
}: VerseIntelligenceBlockProps) {
  const intelligence = await getCachedVerseIntelligence(verseId);
  if (!intelligence) {
    return null;
  }

  const verse = intelligence.verse;
  const bookName = verse.book.name;
  const reference = `${bookName} ${verse.chapter}:${verse.verseNumber}`;
  const primaryText = verse.textKjv ?? verse.textWeb ?? "(Verse text pending)";
  const placeCount = verse.placeMentions.length;
  const situationCount = verse.situationMappings.length;
  const prayerCount = verse.prayerPointMappings.length;

  if (variant === "compact") {
    return (
      <div
        className="border border-gray-200/80 bg-muted/40 rounded-lg px-4 py-3 text-xs text-muted-foreground"
        data-book-id={bookId}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-semibold text-gray-900">Verse intelligence</span>
          <Link
            href={canonicalUrl}
            className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
          >
            View verse entity
          </Link>
        </div>
        <p className="mt-2 text-[11px]">
          {reference} • {placeCount} place(s), {situationCount} situation(s), {prayerCount} prayer point(s)
        </p>
        <p className="text-[11px] text-gray-500">Scores and references are deterministic.</p>
      </div>
    );
  }

  const semanticMatches = intelligence.semanticMatches;

  const aboutBullets = [
    `${reference} is anchored in ${verse.book.testament ?? "the Bible"} tradition (${verse.book.genre ?? "book"}).`,
    `${reference} appears across ${placeCount} place page(s), ${situationCount} situation guide(s), and ${prayerCount} prayer point(s).`,
    `Primary translation snapshot (${bookName}): ${primaryText.slice(0, 120)}${
      primaryText.length > 120 ? "…" : ""
    }`,
  ];

  const exploreLinks = [
    ...verse.placeMentions.map((mapping) => ({
      label: mapping.place.name,
      href: getCanonicalUrl(`/bible-places/${mapping.place.slug}`),
    })),
    ...verse.situationMappings.map((mapping) => ({
      label: mapping.situation.title,
      href: getCanonicalUrl(`/bible-verses-for/${mapping.situation.slug}`),
    })),
    ...verse.prayerPointMappings.map((mapping) => ({
      label: mapping.prayerPoint.title,
      href: getCanonicalUrl(`/prayer-points/${mapping.prayerPoint.slug}`),
    })),
  ];

  return (
    <section
      className="border border-gray-200/70 bg-card rounded-2xl p-6 space-y-5"
      data-book-id={bookId}
    >
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Verse Intelligence</h3>
        <p className="text-sm text-muted-foreground">
          {reference} centralizes translations, references, and semantic matches so the verse can act as a deterministic entity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">About this verse</h4>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {aboutBullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Referenced by</h4>
            <div className="space-y-2 text-sm text-gray-700">
              {verse.placeMentions.length > 0 && (
                <div>
                  <p className="font-medium text-xs text-primary uppercase tracking-wide">Places</p>
                  <ul className="list-disc list-inside">
                    {verse.placeMentions.map((mapping) => (
                      <li key={mapping.place.slug}>
                        <Link
                          href={getCanonicalUrl(`/bible-places/${mapping.place.slug}`)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {mapping.place.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {verse.situationMappings.length > 0 && (
                <div>
                  <p className="font-medium text-xs text-primary uppercase tracking-wide">Situations</p>
                  <ul className="list-disc list-inside">
                    {verse.situationMappings.map((mapping) => (
                      <li key={mapping.situation.slug}>
                        <Link
                          href={getCanonicalUrl(`/bible-verses-for/${mapping.situation.slug}`)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {mapping.situation.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {verse.prayerPointMappings.length > 0 && (
                <div>
                  <p className="font-medium text-xs text-primary uppercase tracking-wide">Prayer Points</p>
                  <ul className="list-disc list-inside">
                    {verse.prayerPointMappings.map((mapping) => (
                      <li key={mapping.prayerPoint.slug}>
                        <Link
                          href={getCanonicalUrl(`/prayer-points/${mapping.prayerPoint.slug}`)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {mapping.prayerPoint.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {verse.placeMentions.length === 0 &&
                verse.situationMappings.length === 0 &&
                verse.prayerPointMappings.length === 0 && (
                  <p className="text-xs text-gray-500">No published references yet.</p>
                )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Explore next</h4>
        {exploreLinks.length === 0 ? (
          <p className="text-xs text-gray-500">No linked entities yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2 text-sm">
            {exploreLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-700 hover:border-blue-500"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900">Semantic matches</h4>
          <Link href={canonicalUrl} className="text-xs text-muted-foreground">
            View verse entity
          </Link>
        </div>
        {semanticMatches.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Embeddings pending. Once verse vectors exist, semantic matches will appear.
          </p>
        ) : (
          <ul className="space-y-2 text-sm text-gray-700">
            {semanticMatches.map((match) => (
              <li key={match.href} className="border border-dashed border-gray-200 rounded-lg p-3">
                <Link href={match.href} className="font-medium text-blue-600 hover:text-blue-800">
                  {match.reference} ({(match.score * 100).toFixed(1)}%)
                </Link>
                <p className="text-xs text-gray-500 mt-1">{match.snippet}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
