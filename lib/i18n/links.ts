/**
 * Helpers for building canonical and hreflang URLs
 * Deterministic URL generation for multi-locale SEO
 */

import { LOCALES, DEFAULT_LOCALE, type Locale, stripLocaleFromPath } from "./locales";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://thelordwill.com";

/**
 * Build absolute URL for a path
 */
export function buildAbsoluteUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}

/**
 * Build canonical URL for a page
 * Canonical always points to the current locale version
 */
export function buildCanonicalUrl(path: string, locale: Locale): string {
  const stripped = stripLocaleFromPath(path);
  return buildAbsoluteUrl(`/${locale}${stripped}`);
}

/**
 * Build hreflang links for all supported locales
 * Returns array of { locale, url } for use in metadata
 */
export function buildHreflangLinks(path: string): Array<{ locale: Locale | "x-default"; url: string }> {
  const stripped = stripLocaleFromPath(path);

  const links: Array<{ locale: Locale | "x-default"; url: string }> = LOCALES.map((locale) => ({
    locale,
    url: buildAbsoluteUrl(`/${locale}${stripped}`),
  }));

  // x-default points to English version
  links.push({
    locale: "x-default",
    url: buildAbsoluteUrl(`/${DEFAULT_LOCALE}${stripped}`),
  });

  return links;
}

/**
 * Build alternates object for Next.js metadata
 */
export function buildAlternates(path: string, locale: Locale): {
  canonical: string;
  languages: Record<string, string>;
} {
  const stripped = stripLocaleFromPath(path);

  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    languages[loc] = buildAbsoluteUrl(`/${loc}${stripped}`);
  }
  languages["x-default"] = buildAbsoluteUrl(`/${DEFAULT_LOCALE}${stripped}`);

  return {
    canonical: buildCanonicalUrl(path, locale),
    languages,
  };
}

/**
 * Build locale switcher URLs for the current page
 */
export function buildLocaleSwitcherUrls(path: string): Array<{ locale: Locale; url: string; isCurrent: boolean }> {
  const currentLocale = path.split("/")[1] as Locale;
  const stripped = stripLocaleFromPath(path);

  return LOCALES.map((locale) => ({
    locale,
    url: `/${locale}${stripped}`,
    isCurrent: locale === currentLocale,
  }));
}
