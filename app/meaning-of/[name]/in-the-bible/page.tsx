import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCanonicalUrl, titleCase } from "@/lib/utils";
import { getBiblicalName } from "@/lib/db/queries";

// Force SSR - disable static generation
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    name: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { name } = await params;

  if (!process.env.DATABASE_URL) {
    const title = `Meaning of ${titleCase(name)} in the Bible - Biblical Name Meaning`;
    const canonicalUrl = getCanonicalUrl(`/meaning-of-${name}-in-the-bible`);

    return {
      title,
      alternates: {
        canonical: canonicalUrl,
      },
    };
  }

  const data = await getBiblicalName(name);

  if (!data) {
    return {
      title: "Name Not Found",
    };
  }

  const title = `Meaning of ${data.name} in the Bible - Biblical Name Meaning`;
  const description = data.metaDescription || `Discover the biblical meaning and significance of the name ${data.name}`;
  const canonicalUrl = getCanonicalUrl(`/meaning-of-${name}-in-the-bible`);
  const imageUrl = getCanonicalUrl(`/api/og?name=${encodeURIComponent(data.name)}&type=name`);

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
          alt: `Meaning of ${data.name} in the Bible`,
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
      `${data.name} meaning`,
      `biblical name ${data.name}`,
      `${data.name} in the Bible`,
      "biblical names",
      "name meanings",
      data.originLanguage,
    ],
  };
}

export default async function NameMeaningPage({ params }: PageProps) {
  const { name } = await params;

  if (!process.env.DATABASE_URL) {
    return (
      <main className="min-h-screen py-12 px-4">
        <article className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Meaning of {titleCase(name)} in the Bible
            </h1>
            <p className="text-xl text-muted-foreground">
              Database connection required to display name data.
            </p>
          </header>
        </article>
      </main>
    );
  }

  const data = await getBiblicalName(name);

  if (!data) {
    notFound();
  }

  // JSON-LD Schema for the specific name page
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Meaning of ${data.name} in the Bible`,
    description: data.metaDescription,
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
      "@id": getCanonicalUrl(`/meaning-of-${name}-in-the-bible`),
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
              Meaning of {data.name} in the Bible
            </h1>
            <p className="text-xl text-muted-foreground">
              {data.metaDescription || `Discover the biblical meaning and significance of the name ${data.name}`}
            </p>
          </header>

          <section className="prose prose-lg max-w-none">
            <div className="bg-card border rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-3">Name Details</h2>
              <dl className="space-y-2">
                <div>
                  <dt className="font-semibold inline">Name:</dt>
                  <dd className="inline ml-2">{data.name}</dd>
                </div>
                <div>
                  <dt className="font-semibold inline">Origin:</dt>
                  <dd className="inline ml-2">{data.originLanguage}</dd>
                </div>
                <div>
                  <dt className="font-semibold inline">Meaning:</dt>
                  <dd className="inline ml-2">{data.meaning}</dd>
                </div>
              </dl>
            </div>

            {data.characterDescription && (
              <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-4">Biblical Significance</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {data.characterDescription}
                </p>
              </div>
            )}

            {data.mentions && data.mentions.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-4">Biblical References</h2>
                <div className="space-y-4">
                  {data.mentions.map((mention) => (
                    <div key={mention.verseId} className="border-l-4 border-blue-500 pl-4">
                      <p className="text-gray-800 italic">
                        {mention.verse.textKjv || mention.verse.textWeb}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.relatedNames && data.relatedNames.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-4">Related Names</h2>
                <div className="grid grid-cols-2 gap-4">
                  {data.relatedNames.map((related) => (
                    <a
                      key={related.id}
                      href={`/meaning-of-${related.slug}-in-the-bible`}
                      className="block p-4 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                    >
                      <h3 className="font-semibold">{related.name}</h3>
                      <p className="text-sm text-muted-foreground">{related.meaning}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>
        </article>
      </main>
    </>
  );
}
