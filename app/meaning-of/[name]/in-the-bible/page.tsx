import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCanonicalUrl, titleCase } from "@/lib/utils";

// Force SSR - disable static generation
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    name: string;
  }>;
}

// Fetch name meaning data (placeholder - replace with actual DB/API call)
async function getNameMeaning(name: string) {
  // TODO: Replace with actual database/API call
  // const data = await db.biblicalName.findUnique({ where: { slug: name } });

  // Placeholder data
  return {
    name: titleCase(name),
    slug: name,
    meaning: `The biblical meaning of ${titleCase(name)}`,
    origin: "Hebrew",
    description: `Discover the deep biblical significance and spiritual meaning of the name ${titleCase(name)}.`,
    verses: [],
    relatedNames: [],
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { name } = await params;
  const data = await getNameMeaning(name);

  if (!data) {
    return {
      title: "Name Not Found",
    };
  }

  const title = `Meaning of ${data.name} in the Bible - Biblical Name Meaning`;
  const description = data.description;
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
      data.origin,
    ],
  };
}

export default async function NameMeaningPage({ params }: PageProps) {
  const { name } = await params;
  const data = await getNameMeaning(name);

  if (!data) {
    notFound();
  }

  // JSON-LD Schema for the specific name page
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Meaning of ${data.name} in the Bible`,
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
              {data.description}
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
                  <dd className="inline ml-2">{data.origin}</dd>
                </div>
                <div>
                  <dt className="font-semibold inline">Meaning:</dt>
                  <dd className="inline ml-2">{data.meaning}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Biblical Significance</h2>
              <p className="text-muted-foreground">
                Content about the biblical significance of {data.name} will be displayed here.
              </p>
            </div>
          </section>
        </article>
      </main>
    </>
  );
}
