/**
 * Strong's Lexicon Display Component
 * Shows original Hebrew/Greek words with transliteration and definitions
 * Server component - no client-side JS needed
 */

interface StrongsEntry {
  strongsId: string;
  originalWord: string;
  transliteration: string;
  definition: string;
  language: string;
}

interface StrongsDisplayProps {
  entries: StrongsEntry[];
  reference: string;
}

export function StrongsDisplay({ entries, reference }: StrongsDisplayProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">
          Original Language Insights
        </h3>
        <p className="text-sm text-muted-foreground">
          Key words from {reference} in their original {entries[0].language} form
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map((entry) => (
          <div
            key={entry.strongsId}
            className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow"
          >
            {/* Strong's Number */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                {entry.strongsId}
              </span>
              <span className="text-xs text-muted-foreground">
                {entry.language}
              </span>
            </div>

            {/* Original Word */}
            <div className="mb-2">
              <div className="text-2xl font-serif mb-1" lang={entry.language === 'Hebrew' ? 'he' : 'el'}>
                {entry.originalWord}
              </div>
              <div className="text-sm text-primary font-medium">
                {entry.transliteration}
              </div>
            </div>

            {/* Definition */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {entry.definition}
            </p>
          </div>
        ))}
      </div>

      {/* Educational note */}
      <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-4 rounded-md border border-blue-100 dark:border-blue-900">
        <p className="font-medium mb-1">💡 Why Original Languages Matter</p>
        <p>
          The Bible was originally written in Hebrew (Old Testament) and Greek (New Testament).
          Studying the original words reveals nuances, connotations, and depths of meaning
          that can be lost in translation. Strong's Concordance numbers help us connect
          English words back to their original language equivalents.
        </p>
      </div>
    </div>
  );
}

/**
 * Compact version for inline display
 */
export function StrongsInline({ entry }: { entry: StrongsEntry }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs"
      title={entry.definition}
    >
      <span className="font-mono text-muted-foreground">{entry.strongsId}</span>
      <span className="font-medium">{entry.transliteration}</span>
      <span className="font-serif" lang={entry.language === 'Hebrew' ? 'he' : 'el'}>
        {entry.originalWord}
      </span>
    </span>
  );
}
