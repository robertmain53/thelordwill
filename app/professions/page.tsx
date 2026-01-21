import type { Metadata } from "next";
import Link from "next/link";
import { getCanonicalUrl } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Bible Verses for Every Profession | The Lord Will",
  description: "Find relevant Bible verses for your profession. Discover biblical wisdom and guidance for teachers, doctors, nurses, and more.",
  alternates: {
    canonical: getCanonicalUrl("/professions"),
  },
};

export default async function ProfessionsPage() {
  const professions = await prisma.profession.findMany({
    where: { status: "published" },
    select: {
      slug: true,
      title: true,
      description: true,
      metaDescription: true,
    },
    orderBy: {
      title: 'asc',
    },
  });

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Bible Verses for Every Profession
          </h1>
          <p className="text-xl text-muted-foreground">
            Discover biblical wisdom and guidance for your professional calling
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {professions.map((profession) => (
            <Link
              key={profession.slug}
              href={`/bible-verses-for/${profession.slug}`}
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
            These verses provide encouragement, ethical principles, and spiritual insight for integrating biblical values
            into your professional life.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            "And whatsoever ye do, do it heartily, as to the Lord, and not unto men" (Colossians 3:23, KJV)
          </p>
        </section>
      </div>
    </main>
  );
}
