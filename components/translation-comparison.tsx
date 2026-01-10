'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Translation } from '@/lib/translations';

/**
 * Translation Comparison Component
 * Displays multiple Bible translations side-by-side or in tabs
 * Provides linguistic depth for SEO and user value
 */

interface TranslationComparisonProps {
  reference: string;
  translations: Translation[];
  defaultVersion?: string;
  layout?: 'tabs' | 'grid';
}

export function TranslationComparison({
  reference,
  translations,
  defaultVersion = 'KJV',
  layout = 'tabs',
}: TranslationComparisonProps) {
  const [activeVersion, setActiveVersion] = useState(defaultVersion);

  // Filter out null translations
  const availableTranslations = translations.filter(t => t.text !== null);

  if (availableTranslations.length === 0) {
    return null;
  }

  const activeTranslation = availableTranslations.find(
    t => t.version === activeVersion
  ) || availableTranslations[0];

  if (layout === 'grid') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{reference} - Comparative Translations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableTranslations.map((translation) => (
            <div
              key={translation.version}
              className="border rounded-lg p-4 bg-card"
            >
              <div className="font-semibold text-sm text-primary mb-2">
                {translation.fullName}
              </div>
              <blockquote className="text-sm leading-relaxed italic">
                "{translation.text}"
              </blockquote>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Tabs layout (default)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold">{reference}</h3>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {availableTranslations.map((translation) => (
            <button
              key={translation.version}
              onClick={() => setActiveVersion(translation.version)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                activeVersion === translation.version
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={`Switch to ${translation.fullName}`}
            >
              {translation.version}
            </button>
          ))}
        </div>
      </div>

      <div className="border rounded-lg p-6 bg-card">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-primary">
            {activeTranslation.fullName}
          </span>
          <span className="text-xs text-muted-foreground">{reference}</span>
        </div>
        <blockquote className="text-lg leading-relaxed">
          "{activeTranslation.text}"
        </blockquote>
      </div>

      {/* Linguistic note */}
      {availableTranslations.length > 1 && (
        <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
          <strong>Translation Note:</strong> Comparing multiple translations provides
          deeper insight into the original meaning. Each version offers unique
          linguistic nuances from the Hebrew and Greek manuscripts.
        </div>
      )}
    </div>
  );
}

/**
 * Re-export prepareTranslations from lib/translations
 * This allows it to be used on the server while keeping backwards compatibility
 */
export { prepareTranslations } from '@/lib/translations';
