/**
 * Locale configuration for multi-language support
 * Deterministic - no LLM translations
 */

export const LOCALES = ["en", "es", "pt"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
  pt: "Português",
};

export const LOCALE_NATIVE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
  pt: "Português",
};

/**
 * UI strings for locale banners and navigation
 * These are static strings, not LLM-generated translations
 */
export const LOCALE_UI: Record<Locale, {
  notTranslated: string;
  viewIn: string;
  switchLocale: string;
}> = {
  en: {
    notTranslated: "This content is available in English.",
    viewIn: "View in",
    switchLocale: "Switch language",
  },
  es: {
    notTranslated: "Este contenido aún no está traducido. Se muestra en inglés.",
    viewIn: "Ver en",
    switchLocale: "Cambiar idioma",
  },
  pt: {
    notTranslated: "Este conteúdo ainda não foi traduzido. Exibindo em inglês.",
    viewIn: "Ver em",
    switchLocale: "Mudar idioma",
  },
};

/**
 * Check if a locale is valid
 */
export function isValidLocale(locale: string): locale is Locale {
  return LOCALES.includes(locale as Locale);
}

/**
 * Get locale from path segment, defaulting to 'en'
 */
export function getLocaleFromPath(path: string): Locale {
  const segment = path.split("/")[1];
  return isValidLocale(segment) ? segment : DEFAULT_LOCALE;
}

/**
 * Strip locale prefix from path
 */
export function stripLocaleFromPath(path: string): string {
  const segments = path.split("/");
  if (segments.length > 1 && isValidLocale(segments[1])) {
    return "/" + segments.slice(2).join("/");
  }
  return path;
}

/**
 * Add locale prefix to path
 */
export function addLocaleToPath(path: string, locale: Locale): string {
  const stripped = stripLocaleFromPath(path);
  if (locale === DEFAULT_LOCALE) {
    return `/en${stripped}`;
  }
  return `/${locale}${stripped}`;
}
