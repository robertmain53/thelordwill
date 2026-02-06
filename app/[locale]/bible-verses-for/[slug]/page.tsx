import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BasePage from "@/app/bible-verses-for/[slug]/page";
import { isValidLocale, type Locale, DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { buildAlternates } from "@/lib/i18n/links";
import { LocaleFallbackBanner, getFallbackRobotsMeta } from "@/components/locale-fallback-banner";
import { localizedField } from "@/lib/i18n/translation-utils";
import { getSituationWithVerses } from "@/lib/db/situation-queries";
import { getProfession } from "@/lib/db/queries";
import { titleCase, getCanonicalUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  if (!isValidLocale(locale)) {
    return {};
  }

  const alternates = buildAlternates(`/bible-verses-for/${slug}`, locale);
  const isTranslated = locale === DEFAULT_LOCALE;

  if (!process.env.DATABASE_URL) {
    const title = `Bible Verses for ${titleCase(slug)}`;

    return {
      title,
      alternates,
      robots: getFallbackRobotsMeta(locale, isTranslated),
    };
  }

  const situationData = await getSituationWithVerses(slug, 10);
  if (situationData) {
    const titleFallback = `Bible Verses for ${situationData.title} - Scripture & Comfort`;
    const descriptionFallback = situationData.metaDescription;
    const localizedTitle = localizedField(
      titleFallback,
      situationData.titleTranslations,
      locale,
      titleFallback,
    );
    const localizedDescription = localizedField(
      descriptionFallback,
      situationData.metaDescriptionTranslations,
      locale,
      descriptionFallback,
    );
    const canonicalUrl = getCanonicalUrl(`/bible-verses-for/${slug}`);
    const imageUrl = getCanonicalUrl(
      `/api/og?situation=${encodeURIComponent(situationData.title)}&type=situation`
    );

    return {
      title: localizedTitle,
      description: localizedDescription,
      alternates,
      robots: getFallbackRobotsMeta(locale, isTranslated),
      openGraph: {
        title: localizedTitle,
        description: localizedDescription,
        url: canonicalUrl,
        type: "article",
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: `Bible Verses for ${situationData.title}`,
          },
        ],
        siteName: "The Lord Will",
      },
      twitter: {
        card: "summary_large_image",
        title: localizedTitle,
        description: localizedDescription,
        images: [imageUrl],
      },
      keywords: [
        `Bible verses for ${situationData.title}`,
        `Scripture for ${situationData.title}`,
        `${situationData.title} Bible verses`,
        "Bible verses",
        "Christian comfort",
        "Biblical guidance",
        "original Hebrew Greek",
        "Strong's Concordance",
      ],
    };
  }

  const profession = await getProfession(slug);
  if (!profession) {
    return {
      title: "Page Not Found",
      alternates,
      robots: getFallbackRobotsMeta(locale, isTranslated),
    };
  }

  const professionTitleFallback = `Bible Verses for ${profession.title} - Scripture & Wisdom`;
  const professionDescriptionFallback = profession.metaDescription ?? profession.description;
    const localizedTitle = localizedField(
      professionTitleFallback,
      profession.titleTranslations as Record<Locale, string> | null,
      locale,
      professionTitleFallback,
    );
    const localizedDescription = localizedField(
      professionDescriptionFallback,
      profession.metaDescriptionTranslations as Record<Locale, string> | null,
      locale,
      professionDescriptionFallback,
    );
  const canonicalUrl = getCanonicalUrl(`/bible-verses-for/${slug}`);
  const imageUrl = getCanonicalUrl(
    `/api/og?profession=${encodeURIComponent(profession.title)}&type=profession`
  );

  return {
    title: localizedTitle,
    description: localizedDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: getFallbackRobotsMeta(locale, isTranslated),
    openGraph: {
      title: localizedTitle,
      description: localizedDescription,
      url: canonicalUrl,
      type: "article",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `Bible Verses for ${profession.title}`,
        },
      ],
      siteName: "The Lord Will",
    },
    twitter: {
      card: "summary_large_image",
      title: localizedTitle,
      description: localizedDescription,
      images: [imageUrl],
    },
    keywords: [
      `Bible verses for ${profession.title}`,
      `Scripture for ${profession.title}`,
      `${profession.title} Bible verses`,
      "Bible verses",
      "Biblical wisdom",
      "Christian profession",
      "Faith at work",
    ],
  };
}

export default async function LocaleBibleVersesPage({ params }: PageProps) {
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
          currentPath={`/${locale}/bible-verses-for/${slug}`}
        />
      )}
      {await BasePage({ params: Promise.resolve({ slug }) })}
    </>
  );
}
