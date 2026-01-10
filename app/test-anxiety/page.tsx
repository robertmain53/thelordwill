import { getSituationWithVerses } from "@/lib/db/situation-queries";

export const dynamic = 'force-dynamic';

export default async function TestAnxietyPage() {
  try {
    const situationData = await getSituationWithVerses('anxiety', 10);

    if (!situationData) {
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold">Situation Not Found</h1>
          <p>The 'anxiety' situation does not exist in the database.</p>
        </div>
      );
    }

    const primaryMapping = situationData.verseMappings[0];

    if (!primaryMapping) {
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold">No Verses Found</h1>
          <p>The anxiety situation exists but has no verse mappings.</p>
          <pre className="mt-4 p-4 bg-gray-100 rounded">
            {JSON.stringify({
              title: situationData.title,
              slug: situationData.slug,
              verseMappingsCount: situationData.verseMappings.length
            }, null, 2)}
          </pre>
        </div>
      );
    }

    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Test: {situationData.title}</h1>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded">
            <h2 className="font-semibold">Situation Data:</h2>
            <p>Slug: {situationData.slug}</p>
            <p>Verse Mappings: {situationData.verseMappings.length}</p>
          </div>

          <div className="p-4 bg-green-50 rounded">
            <h2 className="font-semibold">Primary Verse:</h2>
            <p>Book: {primaryMapping.verse.book.name}</p>
            <p>Reference: {primaryMapping.verse.book.name} {primaryMapping.verse.chapter}:{primaryMapping.verse.verseNumber}</p>
            <p>Has KJV Text: {primaryMapping.verse.textKjv ? 'Yes' : 'No'}</p>
            <p>Has WEB Text: {primaryMapping.verse.textWeb ? 'Yes' : 'No'}</p>
            <p>Relevance: {primaryMapping.relevanceScore}</p>
          </div>

          {primaryMapping.verse.textKjv && (
            <div className="p-4 bg-gray-50 rounded">
              <h2 className="font-semibold">Verse Text (KJV):</h2>
              <p className="italic">"{primaryMapping.verse.textKjv}"</p>
            </div>
          )}

          <div className="p-4 bg-yellow-50 rounded">
            <h2 className="font-semibold">Strong's Numbers:</h2>
            <p>Count: {primaryMapping.verse.strongsNumbers.length}</p>
          </div>
        </div>
      </div>
    );

  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p className="mt-4">An error occurred while loading the page:</p>
        <pre className="mt-4 p-4 bg-red-50 rounded overflow-auto">
          {error instanceof Error ? error.message : String(error)}
        </pre>
        {error instanceof Error && error.stack && (
          <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto text-xs">
            {error.stack}
          </pre>
        )}
      </div>
    );
  }
}
