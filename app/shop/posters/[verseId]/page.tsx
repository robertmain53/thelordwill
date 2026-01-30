import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { getCanonicalUrl } from "@/lib/utils";

export async function generateMetadata({ params }: { params: { verseId: string } }): Promise<Metadata> {
  const verseId = parseInt(params.verseId, 10);
  if (Number.isNaN(verseId)) {
    return { title: "Verse Poster" };
  }

  const verse = await prisma.verse.findUnique({
    where: { id: verseId },
    select: {
      chapter: true,
      verseNumber: true,
      book: { select: { name: true } },
    },
  });

  if (!verse) {
    return { title: "Poster not available" };
  }

  const reference = `${verse.book?.name ?? "Book"} ${verse.chapter}:${verse.verseNumber}`;
  return {
    title: `Verse poster coming soon — ${reference}`,
    description: `Get notified when the ${reference} poster design is ready for order.`,
    alternates: {
      canonical: getCanonicalUrl(`/shop/posters/${verseId}`),
    },
  };
}

export default async function PosterShopPage({ params }: { params: { verseId: string } }) {
  const verseId = parseInt(params.verseId, 10);

  if (Number.isNaN(verseId)) {
    notFound();
  }

  const verse = await prisma.verse.findUnique({
    where: { id: verseId },
    include: {
      book: { select: { name: true } },
    },
  });

  if (!verse) {
    notFound();
  }

  const reference = `${verse.book?.name ?? "Book"} ${verse.chapter}:${verse.verseNumber}`;
  const textPreview = (verse.textKjv || verse.textWeb || verse.textAsv || "").slice(0, 220);
  const mailto = `mailto:hello@thelordwill.com?subject=Poster%20for%20${encodeURIComponent(reference)}`;

  return (
    <main className="min-h-screen bg-background/80 py-12 px-4">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-3">
          <p className="text-sm text-muted-foreground">Verse poster preview</p>
          <h1 className="text-4xl font-bold">Aesthetic poster art for {reference}</h1>
          <p className="text-lg text-gray-700">
            The layout, color palette, and typography are being crafted to honor this Scripture. While the actual print is still in development, we&apos;re collecting interest from readers like you.
          </p>
        </header>

        <section className="space-y-3 rounded-2xl border border-dashed border-primary/40 bg-card p-6">
          <p className="text-sm text-muted-foreground uppercase tracking-wider">Preview verse</p>
          <p className="text-lg text-gray-900 italic">“{textPreview}…”</p>
          <p className="text-xs text-muted-foreground">{reference}</p>
        </section>

        <section className="space-y-4 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-6">
          <p className="text-muted-foreground">
            Posters will include museum-quality paper, archival inks, and optional hand-lettered notes for your personal devotionals or shared spaces.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={mailto}
              className="inline-flex items-center justify-center rounded-full border border-primary px-6 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
            >
              Notify me when it&apos;s ready
            </Link>
            <Link
              href={`/verse/${verse.bookId}/${verse.chapter}/${verse.verseNumber}`}
              className="inline-flex items-center justify-center rounded-full border border-muted px-6 py-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              View verse entity
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
