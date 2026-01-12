import type { Metadata } from "next";
import Link from "next/link";
import { getCanonicalUrl } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Biblical Names and Their Meanings | The Lord Will",
  description: "Discover the meaning and significance of biblical names. Explore the stories, origins, and spiritual significance of names from Scripture.",
  alternates: {
    canonical: getCanonicalUrl("/names"),
  },
};

export default async function NamesPage() {
  const names = await prisma.name.findMany({
    select: {
      slug: true,
      name: true,
      meaning: true,
      metaDescription: true,
      _count: {
        select: {
          mentions: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Group names by first letter
  const alphabetical = names.reduce((acc, name) => {
    const letter = name.name[0].toUpperCase();
    if (!acc[letter]) {
      acc[letter] = [];
    }
    acc[letter].push(name);
    return acc;
  }, {} as Record<string, typeof names>);

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Biblical Names and Their Meanings
          </h1>
          <p className="text-xl text-muted-foreground">
            Explore the rich significance and stories behind names in Scripture
          </p>
        </header>

        {/* Alphabetical navigation */}
        <div className="mb-8 flex flex-wrap gap-2">
          {Object.keys(alphabetical).sort().map((letter) => (
            <a
              key={letter}
              href={`#letter-${letter}`}
              className="px-3 py-1 text-sm border rounded-md hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {letter}
            </a>
          ))}
        </div>

        {Object.entries(alphabetical)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([letter, items]) => (
            <section key={letter} id={`letter-${letter}`} className="mb-12">
              <h2 className="text-3xl font-bold mb-6 text-primary">{letter}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((name) => (
                  <Link
                    key={name.slug}
                    href={`/meaning-of/${name.slug}/in-the-bible`}
                    className="group border rounded-lg p-5 bg-card hover:shadow-md hover:border-primary transition-all"
                  >
                    <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                      {name.name}
                    </h3>
                    {name.meaning && (
                      <p className="text-sm text-muted-foreground mb-3 italic">
                        "{name.meaning}"
                      </p>
                    )}
                    {name.metaDescription && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {name.metaDescription}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">
                        {name._count.mentions} mentions
                      </span>
                      <span className="text-sm text-primary group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}

        {names.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No biblical names have been added yet. Check back soon!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
