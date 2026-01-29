import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BasePage from "@/app/semantic-search/page";
import { isValidLocale, type Locale, DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { buildAlternates } from "@/lib/i18n/links";
import { LocaleFallbackBanner, getFallbackRobotsMeta } from "@/components/locale-fallback-banner";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const baseMetadata: Metadata = {
  title: "Semantic Verse Search - The Lord Will",
  description: "Search for Bible verses by meaning using AI-powered semantic search. Find Scripture that matches what you're looking for, not just keywords.",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    return {};
  }

  const alternates = buildAlternates("/semantic-search", locale);
  const isTranslated = locale === DEFAULT_LOCALE;

  return {
    ...baseMetadata,
    alternates,
    robots: getFallbackRobotsMeta(locale, isTranslated),
  };
}

export default async function LocaleSemanticSearchPage({ params }: PageProps) {
  const { locale: localeParam } = await params;

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const isTranslated = locale === DEFAULT_LOCALE;

  return (
    <>
      {!isTranslated && (
        <LocaleFallbackBanner locale={locale} currentPath={`/${locale}/semantic-search`} />
      )}
      <BasePage />
    </>
  );
}
