// app/[locale]/professions/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { isValidLocale, type Locale, DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { buildAlternates } from "@/lib/i18n/links";
import { LocaleFallbackBanner, getFallbackRobotsMeta } from "@/components/locale-fallback-banner";
import { localizedField } from "@/lib/i18n/translation-utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const PROFESSIONS_META: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Bible Verses for Every Profession",
    description:
      "Find relevant Bible verses for your profession. Discover biblical wisdom and guidance for teachers, doctors, nurses, and more.",
  },
  es: {
    title: "Versículos bíblicos para cada profesión",
    description:
      "Encuentra versículos que fortalecen tu profesión. Sabiduría bíblica para maestros, médicos, enfermeras y más.",
  },
  pt: {
    title: "Versículos bíblicos para cada profissão",
    description:
      "Encontre versículos para fortalecer sua vocação. Sabedoria bíblica para professores, médicos, enfermeiros e outros.",
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    return {};
  }

  const alternates = buildAlternates("/professions", locale);
  const isTranslated = locale === DEFAULT_LOCALE;
  const meta = PROFESSIONS_META[locale];

  return {
    title: meta.title,
    description: meta.description,
    alternates,
    robots: getFallbackRobotsMeta(locale, isTranslated),
  };
}

export default async function ProfessionsPage({ params }: PageProps) {
  const { locale: localeParam } = await params;

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const isTranslated = locale === DEFAULT_LOCALE;

  const rawProfessions = await prisma.profession.findMany({
    where: { status: "published" },
    select: {
      slug: true,
      title: true,
      description: true,
      metaDescription: true,
      titleTranslations: true,
      descriptionTranslations: true,
      metaDescriptionTranslations: true,
    },
    orderBy: { title: "asc" },
  });

  const professions = rawProfessions.map((profession) => ({
    slug: profession.slug,
    title: localizedField(
      profession.title,
      profession.titleTranslations,
      locale,
    ),
    description: localizedField(
      profession.description,
      profession.descriptionTranslations,
      locale,
    ),
    metaDescription: localizedField(
      profession.metaDescription,
      profession.metaDescriptionTranslations,
      locale,
      profession.description,
    ),
  }));

  const heroMeta = PROFESSIONS_META[locale];

  return (
    <>
      {!isTranslated && (
        <LocaleFallbackBanner locale={locale} currentPath={`/${locale}/professions`} />
      )}

      <main className="min-h-screen py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <header className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {heroMeta.title}
            </h1>
            <p className="text-xl text-muted-foreground">{heroMeta.description}</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {professions.map((profession) => (
              <Link
                key={profession.slug}
                href={`/${locale}/bible-verses-for/${profession.slug}`}
                className="group border rounded-lg p-6 bg-card hover:shadow-md hover:border-primary transition-all"
              >
                <h2 className="text-2xl font-semibold mb-3 group-hover:text-primary transition-colors">
                  {profession.title}
                </h2>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {profession.metaDescription || profession.description}
                </p>
                <span className="text-sm text-primary group-hover:translate-x-1 transition-transform inline-block">
                  View verses →
                </span>
              </Link>
            ))}
          </div>

          {professions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No professions have been added yet. Check back soon!
              </p>
            </div>
          )}

          <section className="mt-16 bg-card border rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Faith at Work</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Whatever your profession, the Bible offers wisdom and guidance for living out your faith in your daily work.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              "And whatsoever ye do, do it heartily, as to the Lord, and not unto men" (Colossians 3:23, KJV)
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
