import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { createPosterProvider } from "@/lib/posters/poster-provider";
import { prisma } from "@/lib/db/prisma";
import { getCanonicalUrl } from "@/lib/utils";

interface PageProps {
  params: Promise<{
    verseId: string;
  }>;
}

async function fetchVerse(verseId: number) {
  return prisma.verse.findUnique({
    where: { id: verseId },
    include: {
      book: {
        select: {
          id: true,
          name: true,
          testament: true,
        },
      },
    },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const verseId = parseInt(resolvedParams.verseId, 10);
  if (Number.isNaN(verseId)) {
    return {
      title: "Verse poster preview",
    };
  }

  const verse = await fetchVerse(verseId);
  if (!verse) {
    return {
      title: "Verse poster preview",
    };
  }

  const reference = `${verse.book?.name ?? "Verse"} ${verse.chapter}:${verse.verseNumber}`;
  const canonicalUrl = getCanonicalUrl(`/shop/posters/${verseId}`);

  return {
    title: `${reference} poster preview - The Lord Will`,
    description: `Preview the poster aesthetic inspired by ${reference}. Emerge from Scripture into ethical wall art.`,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function VersePosterPage({ params }: PageProps) {
  const resolvedParams = await params;
  const verseId = parseInt(resolvedParams.verseId, 10);
  if (Number.isNaN(verseId)) {
    notFound();
  }

  const verse = await fetchVerse(verseId);
  if (!verse) {
    notFound();
  }

  const reference = `${verse.book?.name ?? "Verse"} ${verse.chapter}:${verse.verseNumber}`;
  const canonicalUrl = getCanonicalUrl(`/shop/posters/${verseId}`);
  const verseCanonical = getCanonicalUrl(`/verse/${verse.bookId}/${verse.chapter}/${verse.verseNumber}`);
  const posterDescriptor = await createPosterProvider().describeVersePoster(verseId);
  const breadcrumbs = [
    { label: "Home", href: "/", position: 1 },
    { label: "Shop", href: "/shop/posters", position: 2 },
    { label: reference, href: canonicalUrl, position: 3 },
  ];

  const palette = posterDescriptor.colorPalette.map((color) => (
    <span
      key={color}
      className="h-10 w-10 rounded-full border border-gray-200"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  ));

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <Breadcrumbs items={breadcrumbs} />

        <section className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">{reference} poster</h1>
          <p className="text-muted-foreground">
            Ethical, Scripture-forward art direction that keeps the verse at the center while you wait for the studio release.
          </p>
        </section>

        <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-wide text-primary">Tagline</p>
              <p className="text-lg font-semibold text-gray-900">{posterDescriptor.tagline}</p>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Orientation: {posterDescriptor.orientation}
            </span>
          </div>
          <p className="text-sm text-gray-700">{posterDescriptor.description}</p>
          <div className="flex flex-wrap gap-3">{palette}</div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/api/posters/verse/${verseId}`}
              className="inline-flex items-center justify-center rounded-full border border-blue-500 px-5 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
            >
              View descriptor JSON
            </Link>
            <Link
              href={verseCanonical}
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Back to verse
            </Link>
          </div>
        </section>

        <section className="bg-card border border-dashed border-gray-200 rounded-2xl p-6 space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">Coming soon</h2>
          <p className="text-sm text-muted-foreground">
            We are building an ethical commerce funnel for Scripture-inspired posters. No automated checkout yet—just a curated queue for new releases. Save this preview and join the waitlist when you are ready to secure yours.
          </p>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">No Etsy api. No checkout.</p>
        </section>
      </div>
    </main>
  );
}
