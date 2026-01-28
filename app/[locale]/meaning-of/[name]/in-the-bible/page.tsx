import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BasePage, {
  generateMetadata as baseGenerateMetadata,
} from "@/app/meaning-of/[name]/in-the-bible/page";
import { isValidLocale, type Locale, DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { buildAlternates } from "@/lib/i18n/links";
import { LocaleFallbackBanner, getFallbackRobotsMeta } from "@/components/locale-fallback-banner";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ locale: string; name: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, name } = await params;

  if (!isValidLocale(locale)) {
    return {};
  }

  const base = await baseGenerateMetadata({ params: Promise.resolve({ name }) });
  const alternates = buildAlternates(`/meaning-of/${name}/in-the-bible`, locale);
  const isTranslated = locale === DEFAULT_LOCALE;

  return {
    ...base,
    alternates,
    robots: getFallbackRobotsMeta(locale, isTranslated),
  };
}

export default async function LocaleNameMeaningPage({ params }: PageProps) {
  const { locale: localeParam, name } = await params;

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
          currentPath={`/${locale}/meaning-of/${name}/in-the-bible`}
        />
      )}
      {await BasePage({ params: Promise.resolve({ name }) })}
    </>
  );
}
