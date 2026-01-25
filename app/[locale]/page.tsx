// app/[locale]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale, DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { buildAlternates } from "@/lib/i18n/links";
import { LocaleFallbackBanner, getFallbackRobotsMeta } from "@/components/locale-fallback-banner";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    return {};
  }

  const alternates = buildAlternates("/", locale);
  const isTranslated = locale === DEFAULT_LOCALE;

  return {
    title: "The Lord Will - Biblical Wisdom & Holy Land Tours",
    description: "Discover biblical names, Bible verses for every situation and profession, sacred places in Scripture, and practical Bible travel itineraries.",
    alternates,
    robots: getFallbackRobotsMeta(locale, isTranslated),
  };
}

export default async function HomePage({ params }: PageProps) {
  const { locale: localeParam } = await params;

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const isTranslated = locale === DEFAULT_LOCALE;

  return (
    <>
      {!isTranslated && (
        <LocaleFallbackBanner locale={locale} currentPath={`/${locale}`} />
      )}

      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            The Lord Will
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover the meaning of biblical names, find comfort in Scripture,
            and walk where Jesus walked in the Holy Land.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mt-12">
            <Link
              href={`/${locale}/bible-places`}
              className="p-6 border-2 rounded-lg hover:shadow-xl hover:border-blue-500 transition-all group"
            >
              <div className="text-4xl mb-4">🏛️</div>
              <h2 className="text-2xl font-semibold mb-3 group-hover:text-blue-600">
                Biblical Places
              </h2>
              <p className="text-muted-foreground">
                Explore sacred sites from Scripture and plan your Christian pilgrimage.
              </p>
            </Link>

            <Link
              href={`/${locale}/bible-travel`}
              className="p-6 border-2 rounded-lg hover:shadow-xl hover:border-blue-500 transition-all group"
            >
              <div className="text-4xl mb-4">🧭</div>
              <h2 className="text-2xl font-semibold mb-3 group-hover:text-blue-600">
                Bible Travel
              </h2>
              <p className="text-muted-foreground">
                Ready-to-use pilgrimage itineraries with daily readings and practical planning notes.
              </p>
            </Link>

            <Link
              href={`/${locale}/situations`}
              className="p-6 border-2 rounded-lg hover:shadow-xl hover:border-blue-500 transition-all group"
            >
              <div className="text-4xl mb-4">📖</div>
              <h2 className="text-2xl font-semibold mb-3 group-hover:text-blue-600">
                Verses for Situations
              </h2>
              <p className="text-muted-foreground">
                Find comfort and guidance through Bible verses for life's moments.
              </p>
            </Link>

            <Link
              href={`/${locale}/professions`}
              className="p-6 border-2 rounded-lg hover:shadow-xl hover:border-blue-500 transition-all group"
            >
              <div className="text-4xl mb-4">💼</div>
              <h2 className="text-2xl font-semibold mb-3 group-hover:text-blue-600">
                Verses for Professions
              </h2>
              <p className="text-muted-foreground">
                Discover biblical wisdom relevant to your profession and calling.
              </p>
            </Link>

            <Link
              href={`/${locale}/prayer-points`}
              className="p-6 border-2 rounded-lg hover:shadow-xl hover:border-blue-500 transition-all group"
            >
              <div className="text-4xl mb-4">🙏</div>
              <h2 className="text-2xl font-semibold mb-3 group-hover:text-blue-600">
                Prayer Points
              </h2>
              <p className="text-muted-foreground">
                Scripture-anchored prayer topics with curated verses and guidance.
              </p>
            </Link>
          </div>

          {/* Quick Links Section */}
          <div className="mt-16 pt-8 border-t">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Popular Pages</h3>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href={`/${locale}/bible-places/jerusalem`}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                Jerusalem
              </Link>
              <Link
                href="/about"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                About Us
              </Link>
              <Link
                href="/editorial-process"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Editorial Process
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
