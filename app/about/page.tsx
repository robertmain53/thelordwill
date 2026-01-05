import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us - The Lord Will",
  description:
    "Learn about The Lord Will's mission to make biblical wisdom accessible through comprehensive Scripture references, original language insights, and expert curation.",
  alternates: {
    canonical: getCanonicalUrl("/about"),
  },
  openGraph: {
    title: "About Us - The Lord Will",
    description:
      "Learn about The Lord Will's mission to make biblical wisdom accessible through comprehensive Scripture references, original language insights, and expert curation.",
    url: getCanonicalUrl("/about"),
    type: "website",
  },
};

export default function AboutPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    mainEntity: {
      "@type": "Organization",
      name: "The Lord Will",
      url: getCanonicalUrl("/"),
      description:
        "A comprehensive Bible resource providing Scripture guidance for life situations, biblical name meanings, and profession-specific verses.",
      foundingDate: "2026",
      knowsAbout: [
        "Biblical Studies",
        "Scripture Analysis",
        "Hebrew Language",
        "Greek Language",
        "Biblical Names",
        "Christian Theology",
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <main className="min-h-screen py-12 px-4">
        <article className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <header className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">About The Lord Will</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Making biblical wisdom accessible through comprehensive Scripture references
              and expert curation.
            </p>
          </header>

          {/* Mission */}
          <section className="space-y-4">
            <h2 className="text-3xl font-bold">Our Mission</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-lg leading-relaxed">
                The Lord Will exists to help people discover God's wisdom for every area of life.
                We believe Scripture speaks to every human situation, emotion, and calling—and that
                understanding the Bible in its original languages deepens our comprehension of God's truth.
              </p>
              <p className="text-lg leading-relaxed">
                Our platform connects seekers with relevant biblical passages, providing not just verses
                but context, original language insights from Strong's Concordance, and multi-translation
                comparisons to ensure accuracy and depth.
              </p>
            </div>
          </section>

          {/* What We Offer */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold">What We Offer</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="border rounded-lg p-6 bg-card">
                <h3 className="text-xl font-semibold mb-3">Situation-Based Scripture</h3>
                <p className="text-muted-foreground">
                  Find biblical guidance for anxiety, grief, joy, leadership, and 1,000+ life situations.
                  Each verse is relevance-scored for accuracy.
                </p>
              </div>

              <div className="border rounded-lg p-6 bg-card">
                <h3 className="text-xl font-semibold mb-3">Biblical Name Meanings</h3>
                <p className="text-muted-foreground">
                  Discover the original Hebrew and Greek meanings of 50,000+ biblical names,
                  with character descriptions and first mentions.
                </p>
              </div>

              <div className="border rounded-lg p-6 bg-card">
                <h3 className="text-xl font-semibold mb-3">Original Language Insights</h3>
                <p className="text-muted-foreground">
                  Access Strong's Concordance data for key words, revealing nuances lost in translation.
                </p>
              </div>
            </div>
          </section>

          {/* Data Sources */}
          <section className="space-y-4">
            <h2 className="text-3xl font-bold">Our Data Sources</h2>
            <div className="bg-muted/30 border rounded-lg p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Biblical Texts</h3>
                <p className="text-muted-foreground">
                  We source our biblical text from the{" "}
                  <a
                    href="https://bolls.life"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Bolls Bible API
                  </a>
                  , which provides access to multiple public domain translations including King James Version (KJV),
                  World English Bible (WEB), American Standard Version (ASV), Bible in Basic English (BBE),
                  and Young's Literal Translation (YLT).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Strong's Concordance</h3>
                <p className="text-muted-foreground">
                  Original language data comes from James Strong's Exhaustive Concordance of the Bible (1890),
                  a public domain reference work that assigns unique numbers to every original Hebrew and Greek word.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Situation Mapping</h3>
                <p className="text-muted-foreground">
                  Our relevance scores (1-100) are determined through a combination of thematic analysis,
                  cross-referencing scholarly commentaries, and community verification to ensure accurate
                  connections between Scripture and life situations.
                </p>
              </div>
            </div>
          </section>

          {/* Methodology */}
          <section className="space-y-4">
            <h2 className="text-3xl font-bold">Our Approach</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-lg font-semibold mb-2">1. Comprehensive Coverage</h3>
                <p className="text-muted-foreground">
                  We index all 31,102 verses of the Bible across multiple translations, ensuring
                  no relevant passage is overlooked.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-lg font-semibold mb-2">2. Multi-Translation Comparison</h3>
                <p className="text-muted-foreground">
                  Every key verse includes 5 English translations, allowing readers to see linguistic
                  variations and choose the rendering that speaks most clearly to them.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-lg font-semibold mb-2">3. Original Language Transparency</h3>
                <p className="text-muted-foreground">
                  We display Strong's Concordance numbers with transliterations, giving readers access
                  to the Hebrew and Greek words behind the English text.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-lg font-semibold mb-2">4. Contextual AI Enhancement</h3>
                <p className="text-muted-foreground">
                  AI-generated introductions and FAQs provide contextual understanding while maintaining
                  theological accuracy through strict prompt engineering and source citation.
                </p>
              </div>
            </div>
          </section>

          {/* Trustworthiness */}
          <section className="space-y-4">
            <h2 className="text-3xl font-bold">Why Trust Us?</h2>
            <div className="prose prose-lg max-w-none">
              <ul className="space-y-2">
                <li className="text-lg">
                  <strong>Transparency:</strong> We openly document our{" "}
                  <Link href="/editorial-process" className="text-primary hover:underline">
                    editorial process
                  </Link>{" "}
                  and data sources.
                </li>
                <li className="text-lg">
                  <strong>Accuracy:</strong> All Scripture text comes from verified public domain translations
                  with no modifications.
                </li>
                <li className="text-lg">
                  <strong>Scholarship:</strong> Strong's Concordance data is cross-referenced with
                  original Hebrew and Greek texts.
                </li>
                <li className="text-lg">
                  <strong>No Interpretation Bias:</strong> We present verses with multiple translations
                  and linguistic data, letting Scripture speak for itself.
                </li>
                <li className="text-lg">
                  <strong>Open Methodology:</strong> Our relevance scoring and AI content generation
                  processes are fully documented.
                </li>
              </ul>
            </div>
          </section>

          {/* Contact */}
          <section className="space-y-4">
            <h2 className="text-3xl font-bold">Contact Us</h2>
            <div className="bg-gradient-to-r from-primary/10 to-transparent border rounded-lg p-6">
              <p className="text-lg mb-4">
                We welcome questions, feedback, and corrections to improve our content.
              </p>
              <div className="space-y-2">
                <p>
                  <strong>General Inquiries:</strong>{" "}
                  <a href="mailto:contact@thelordwill.com" className="text-primary hover:underline">
                    contact@thelordwill.com
                  </a>
                </p>
                <p>
                  <strong>Content Corrections:</strong>{" "}
                  <a href="mailto:corrections@thelordwill.com" className="text-primary hover:underline">
                    corrections@thelordwill.com
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* Footer Note */}
          <section className="bg-muted/30 border rounded-lg p-6">
            <p className="text-sm text-muted-foreground">
              <strong>Disclaimer:</strong> The Lord Will is an educational resource and does not replace
              pastoral counsel or in-depth Bible study. We encourage readers to study Scripture in context,
              consult trusted teachers, and seek the Holy Spirit's guidance in applying God's Word.
            </p>
          </section>
        </article>
      </main>
    </>
  );
}
