/**
 * Banner shown when content is displayed in English as a fallback
 * for non-English locales that haven't been translated yet
 */

import Link from "next/link";
import { type Locale, LOCALE_UI, LOCALE_NAMES, DEFAULT_LOCALE } from "@/lib/i18n/locales";

interface LocaleFallbackBannerProps {
  locale: Locale;
  currentPath: string;
}

export function LocaleFallbackBanner({ locale, currentPath }: LocaleFallbackBannerProps) {
  // Don't show banner for English (default locale)
  if (locale === DEFAULT_LOCALE) {
    return null;
  }

  const ui = LOCALE_UI[locale];
  const stripLocale = currentPath.replace(`/${locale}`, "");
  const englishPath = `/en${stripLocale}`;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 text-sm">
        <p className="text-amber-800">
          {ui.notTranslated}
        </p>
        <Link
          href={englishPath}
          className="shrink-0 text-amber-700 hover:text-amber-900 underline"
        >
          {ui.viewIn} {LOCALE_NAMES.en}
        </Link>
      </div>
    </div>
  );
}

/**
 * Injects noindex meta tag for fallback (untranslated) content
 * Use in page metadata when content is not translated
 */
export function getFallbackRobotsMeta(locale: Locale, isTranslated: boolean): string {
  if (locale === DEFAULT_LOCALE || isTranslated) {
    return "index,follow";
  }
  return "noindex,follow";
}
