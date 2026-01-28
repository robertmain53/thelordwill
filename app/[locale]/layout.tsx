import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isValidLocale, type Locale, LOCALE_NAMES } from "@/lib/i18n/locales";
import { buildAlternates } from "@/lib/i18n/links";

// Cache locale-prefixed routes by default (admin routes are outside this segment).
export const revalidate = 3600;

// Generate static params for all locales
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

// Dynamic metadata with hreflang
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    return {};
  }

  const alternates = buildAlternates("/", locale);

  return {
    alternates,
    openGraph: {
      locale: locale === "en" ? "en_US" : locale === "es" ? "es_ES" : "pt_BR",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <div data-locale={locale}>
      {children}
    </div>
  );
}
