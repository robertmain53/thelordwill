import { notFound } from "next/navigation";
import { getSituationWithVerses, formatVerseReference } from "@/lib/db/situation-queries";
import { generateIntroduction, generateFAQs } from "@/lib/content/generator";
import { generateBreadcrumbs, generateLinkingStrategy, getTrendingNames } from "@/lib/seo/internal-linking";

export const dynamic = 'force-dynamic';

export default async function TestFullPage() {
  const slug = 'anxiety';

  try {
    console.log('Step 1: Get situation data');
    const situationData = await getSituationWithVerses(slug, 10);

    if (!situationData) {
      notFound();
    }

    const primaryMapping = situationData.verseMappings[0];
    if (!primaryMapping) {
      notFound();
    }

    console.log('Step 2: Format verse reference');
    const primaryVerse = primaryMapping.verse;
    const primaryReference = formatVerseReference(primaryVerse);

    console.log('Step 3: Prepare verses for generation');
    const versesForGeneration = situationData.verseMappings.slice(0, 5).map((mapping) => ({
      reference: formatVerseReference(mapping.verse),
      text: mapping.verse.textKjv || mapping.verse.textWeb || '',
    }));

    console.log('Step 4: Generate introduction');
    const introduction = await generateIntroduction({
      situation: situationData.title,
      verses: versesForGeneration,
      targetWordCount: 300,
    });

    console.log('Step 5: Generate FAQs');
    const faqs = await generateFAQs(situationData.title, versesForGeneration);

    console.log('Step 6: Generate breadcrumbs');
    const breadcrumbs = generateBreadcrumbs('situation', situationData.title, slug);

    console.log('Step 7: Generate linking strategy');
    const linkingStrategy = await generateLinkingStrategy('situation', slug, breadcrumbs);

    console.log('Step 8: Get trending names');
    const trendingNames = await getTrendingNames(2);

    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="bg-green-50 p-4 rounded">
          <h1 className="text-2xl font-bold text-green-800">✓ All Steps Completed Successfully!</h1>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-white border rounded">
            <h2 className="font-semibold mb-2">1. Situation Data</h2>
            <p>Title: {situationData.title}</p>
            <p>Verses: {situationData.verseMappings.length}</p>
          </div>

          <div className="p-4 bg-white border rounded">
            <h2 className="font-semibold mb-2">2. Primary Verse</h2>
            <p>Reference: {primaryReference}</p>
          </div>

          <div className="p-4 bg-white border rounded">
            <h2 className="font-semibold mb-2">3. Verses for Generation</h2>
            <p>Count: {versesForGeneration.length}</p>
          </div>

          <div className="p-4 bg-white border rounded">
            <h2 className="font-semibold mb-2">4. Introduction</h2>
            <p>Length: {introduction.content.length} characters</p>
            <p>Word count: {introduction.wordCount}</p>
          </div>

          <div className="p-4 bg-white border rounded">
            <h2 className="font-semibold mb-2">5. FAQs</h2>
            <p>Count: {faqs.length}</p>
          </div>

          <div className="p-4 bg-white border rounded">
            <h2 className="font-semibold mb-2">6. Breadcrumbs</h2>
            <p>Count: {breadcrumbs.length}</p>
            <ul className="list-disc pl-5">
              {breadcrumbs.map(b => (
                <li key={b.position}>{b.label} ({b.href})</li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-white border rounded">
            <h2 className="font-semibold mb-2">7. Linking Strategy</h2>
            <p>Total Links: {linkingStrategy.totalLinks}</p>
            <p>Related Situations: {linkingStrategy.relatedSituations.length}</p>
            <p>Thematic Links: {linkingStrategy.thematicLinks.length}</p>
            <p>Trending Names in strategy: {linkingStrategy.trendingNames.length}</p>
          </div>

          <div className="p-4 bg-white border rounded">
            <h2 className="font-semibold mb-2">8. Trending Names (separate call)</h2>
            <p>Count: {trendingNames.length}</p>
            <ul className="list-disc pl-5">
              {trendingNames.map(name => (
                <li key={name.href}>{name.title} - {name.href}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );

  } catch (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 p-4 rounded mb-4">
          <h1 className="text-2xl font-bold text-red-800">✗ Error Occurred</h1>
        </div>
        <div className="bg-white border rounded p-4">
          <h2 className="font-semibold mb-2">Error Message:</h2>
          <pre className="text-sm overflow-auto">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </div>
        {error instanceof Error && error.stack && (
          <div className="bg-white border rounded p-4 mt-4">
            <h2 className="font-semibold mb-2">Stack Trace:</h2>
            <pre className="text-xs overflow-auto">
              {error.stack}
            </pre>
          </div>
        )}
      </div>
    );
  }
}
