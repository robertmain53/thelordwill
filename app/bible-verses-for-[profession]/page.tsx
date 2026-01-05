import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCanonicalUrl, titleCase } from "@/lib/utils";

// Force SSR - disable static generation
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    profession: string;
  }>;
}

// Fetch profession verses data (placeholder - replace with actual DB/API call)
async function getProfessionVerses(profession: string) {
  // TODO: Replace with actual database/API call
  // const data = await db.profession.findUnique({ where: { slug: profession } });

  // Placeholder data
  return {
    title: titleCase(profession),
    slug: profession,
    description: `Discover biblical wisdom and guidance for ${titleCase(profession)}s through relevant Bible verses.`,
    verses: [],
    relatedProfessions: [],
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { profession } = await params;
  const data = await getProfessionVerses(profession);

  if (!data) {
    return {
      title: "Profession Not Found",
    };
  }

  const title = `Bible Verses for ${data.title}s - Scripture & Wisdom`;
  const description = data.description;
  const canonicalUrl = getCanonicalUrl(`/bible-verses-for-${profession}`);
  const imageUrl = getCanonicalUrl(`/api/og?profession=${encodeURIComponent(data.title)}&type=profession`);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "article",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `Bible Verses for ${data.title}s`,
        },
      ],
      siteName: "The Lord Will",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    keywords: [
      `Bible verses for ${data.title}s`,
      `Scripture for ${data.title}`,
      `${data.title} Bible verses`,
      "Biblical wisdom",
      "Christian profession",
      "Faith at work",
    ],
  };
}

export default async function ProfessionVersesPage({ params }: PageProps) {
  const { profession } = await params;
  const data = await getProfessionVerses(profession);

  if (!data) {
    notFound();
  }

  // JSON-LD Schema for the specific profession page
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Bible Verses for ${data.title}s`,
    description: data.description,
    author: {
      "@type": "Organization",
      name: "The Lord Will",
    },
    publisher: {
      "@type": "Organization",
      name: "The Lord Will",
      logo: {
        "@type": "ImageObject",
        url: getCanonicalUrl("/logo.png"),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": getCanonicalUrl(`/bible-verses-for-${profession}`),
    },
    about: {
      "@type": "Thing",
      name: `${data.title} profession`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <main className="min-h-screen py-12 px-4">
        <article className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Bible Verses for {data.title}s
            </h1>
            <p className="text-xl text-muted-foreground">
              {data.description}
            </p>
          </header>

          <section className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">
                Biblical Wisdom for {data.title}s
              </h2>
              <p className="text-muted-foreground">
                Relevant Bible verses for {data.title}s will be displayed here.
              </p>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">
                Applying Faith at Work
              </h2>
              <p className="text-muted-foreground">
                Practical guidance for applying biblical principles in your profession as a {data.title}.
              </p>
            </div>
          </section>
        </article>
      </main>
    </>
  );
}
