import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BasePage, {
  generateMetadata as baseGenerateMetadata,
} from "@/app/prayer-points/[slug]/page";
import { isValidLocale, type Locale, DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { buildAlternates } from "@/lib/i18n/links";
import { LocaleFallbackBanner, getFallbackRobotsMeta } from "@/components/locale-fallback-banner";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  if (!isValidLocale(locale)) {
    return {};
  }

  const base = await baseGenerateMetadata({ params: Promise.resolve({ slug }) });
  const alternates = buildAlternates(`/prayer-points/${slug}`, locale);
  const isTranslated = locale === DEFAULT_LOCALE;

  return {
    ...base,
    alternates,
    robots: getFallbackRobotsMeta(locale, isTranslated),
  };
}

export default async function LocalePrayerPointPage({ params }: PageProps) {
  const { locale: localeParam, slug } = await params;

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const isTranslated = locale === DEFAULT_LOCALE;

  return (
    <>
      {!isTranslated && (
        <LocaleFallbackBanner
          locale={locale}
          currentPath={`/${locale}/prayer-points/${slug}`}
        />
      )}
      {await BasePage({ params: Promise.resolve({ slug }) })}
    </>
  );
}
