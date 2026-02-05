import type { Locale } from "./locales";

export function localizedField(
  base: string | null | undefined,
  translations: Record<Locale, string> | null | undefined,
  locale: Locale,
  fallback?: string,
) {
  const text = base ?? fallback ?? "";
  if (!translations) {
    return text;
  }
  return translations[locale] ?? text;
}
