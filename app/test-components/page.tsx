import { getSituationWithVerses, formatVerseReference, getTopStrongsFromVerse } from "@/lib/db/situation-queries";
import { generateIntroduction, generateFAQs, validateContentQuality } from "@/lib/content/generator";
import { TranslationComparison } from "@/components/translation-comparison";
import { prepareTranslations } from "@/lib/translations";
import { StrongsDisplay } from "@/components/strongs-display";
import { FAQSection } from "@/components/faq-section";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { InternalLinks, ThematicCluster } from "@/components/internal-links";
import { generateLinkingStrategy, generateBreadcrumbs, validateLinkingDensity, getTrendingNames } from "@/lib/seo/internal-linking";
import { getCanonicalUrl } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default async function TestComponentsPage() {
  const slug = 'anxiety';

  try {
    // Get all the data
    const situationData = await getSituationWithVerses(slug, 10);
    if (!situationData) {
      return <div>Situation not found</div>;
    }

    const primaryMapping = situationData.verseMappings[0];
    if (!primaryMapping) {
      return <div>No verses found</div>;
    }

    const primaryVerse = primaryMapping.verse;
    const primaryReference = formatVerseReference(primaryVerse);
    const topStrongs = getTopStrongsFromVerse(primaryVerse, 3);

    const versesForGeneration = situationData.verseMappings.slice(0, 5).map((mapping) => ({
      reference: formatVerseReference(mapping.verse),
      text: mapping.verse.textKjv || mapping.verse.textWeb || '',
    }));

    const introduction = await generateIntroduction({
      situation: situationData.title,
      verses: versesForGeneration,
      targetWordCount: 300,
    });

    const faqs = await generateFAQs(situationData.title, versesForGeneration);
    const breadcrumbs = generateBreadcrumbs('situation', situationData.title, slug);
    const linkingStrategy = await generateLinkingStrategy('situation', slug, breadcrumbs);
    const trendingNames = await getTrendingNames(2);
    const linkingDensity = validateLinkingDensity(linkingStrategy.totalLinks);

    const qualityReport = validateContentQuality({
      introduction: introduction.content,
      translationCount: prepareTranslations(primaryVerse).filter(t => t.text).length,
      strongsCount: topStrongs.length,
      faqCount: faqs.length,
    });

    const canonicalUrl = getCanonicalUrl(`/bible-verses-for/${slug}`);

    return (
      <main className="min-h-screen py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Component Rendering Test</h1>
            <div className="bg-green-50 p-4 rounded mb-4">
              <p className="font-semibold">✓ Data fetched successfully</p>
              <p className="text-sm">Now testing component rendering...</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Test 1: Breadcrumbs */}
            <section className="border p-4 rounded">
              <h2 className="text-xl font-bold mb-4">1. Breadcrumbs Component</h2>
              <Breadcrumbs items={breadcrumbs} />
              <p className="text-sm text-green-600 mt-2">✓ Rendered</p>
            </section>

            {/* Test 2: Translation Comparison */}
            <section className="border p-4 rounded">
              <h2 className="text-xl font-bold mb-4">2. TranslationComparison Component</h2>
              <TranslationComparison
                reference={primaryReference}
                translations={prepareTranslations(primaryVerse)}
                defaultVersion="KJV"
                layout="tabs"
              />
              <p className="text-sm text-green-600 mt-2">✓ Rendered</p>
            </section>

            {/* Test 3: Strong's Display */}
            <section className="border p-4 rounded">
              <h2 className="text-xl font-bold mb-4">3. StrongsDisplay Component</h2>
              {topStrongs.length > 0 ? (
                <>
                  <StrongsDisplay entries={topStrongs} reference={primaryReference} />
                  <p className="text-sm text-green-600 mt-2">✓ Rendered with {topStrongs.length} entries</p>
                </>
              ) : (
                <p className="text-sm text-yellow-600">No Strong's numbers available</p>
              )}
            </section>

            {/* Test 4: FAQ Section */}
            <section className="border p-4 rounded">
              <h2 className="text-xl font-bold mb-4">4. FAQSection Component</h2>
              <FAQSection faqs={faqs} pageUrl={canonicalUrl} />
              <p className="text-sm text-green-600 mt-2">✓ Rendered</p>
            </section>

            {/* Test 5: Internal Links */}
            <section className="border p-4 rounded">
              <h2 className="text-xl font-bold mb-4">5. InternalLinks Component</h2>
              <InternalLinks
                title="Related Situations"
                links={linkingStrategy.relatedSituations}
              />
              <p className="text-sm text-green-600 mt-2">✓ Rendered</p>
            </section>

            {/* Test 6: Thematic Cluster */}
            <section className="border p-4 rounded">
              <h2 className="text-xl font-bold mb-4">6. ThematicCluster Component</h2>
              {linkingStrategy.thematicLinks.length > 0 ? (
                <>
                  <ThematicCluster
                    title="Related Biblical Topics"
                    description="Discover connections"
                    links={linkingStrategy.thematicLinks}
                  />
                  <p className="text-sm text-green-600 mt-2">✓ Rendered</p>
                </>
              ) : (
                <p className="text-sm text-yellow-600">No thematic links available</p>
              )}
            </section>

            {/* Test 7: Quality Report Data */}
            <section className="border p-4 rounded">
              <h2 className="text-xl font-bold mb-4">7. Quality Report</h2>
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                {JSON.stringify(qualityReport, null, 2)}
              </pre>
              <p className="text-sm text-green-600 mt-2">✓ Validated</p>
            </section>

            {/* Test 8: Linking Density */}
            <section className="border p-4 rounded">
              <h2 className="text-xl font-bold mb-4">8. Linking Density</h2>
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                {JSON.stringify(linkingDensity, null, 2)}
              </pre>
              <p className="text-sm text-green-600 mt-2">✓ Validated</p>
            </section>

            <div className="bg-green-100 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                ✓ All Components Rendered Successfully!
              </h2>
              <p className="text-green-700">
                If you see this, all components work. The error must be in a specific combination or condition.
              </p>
            </div>
          </div>
        </div>
      </main>
    );

  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Component Rendering Error</h1>
        <div className="bg-red-50 p-4 rounded">
          <p className="font-semibold">Error:</p>
          <pre className="text-sm mt-2 overflow-auto">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </div>
        {error instanceof Error && error.stack && (
          <div className="bg-gray-50 p-4 rounded mt-4">
            <p className="font-semibold">Stack Trace:</p>
            <pre className="text-xs mt-2 overflow-auto">
              {error.stack}
            </pre>
          </div>
        )}
      </div>
    );
  }
}
