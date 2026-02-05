import type { Metadata } from "next";
import { Crimson_Pro, Libre_Baskerville } from "next/font/google"; // Institutional Fonts
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";

// Cache all non-admin pages by default
export const revalidate = 3600;

/** * Institutional Header Font
 * Replaces GeistSans to remove the "AI-built" look.
 */
const serifHeading = Crimson_Pro({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "800"],
});

/** * Biblical Body Font
 * Replaces GeistMono for a traditional, authoritative reading experience.
 */
const serifBody = Libre_Baskerville({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
});

// Global metadataBase for absolute URLs
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://thelordwill.com'),
  title: {
    default: "The Lord Will - Biblical Names & Verses",
    template: "%s | The Lord Will",
  },
  description: "Discover the meaning of biblical names and find relevant Bible verses for every situation and profession.",
  keywords: ["Bible", "Bible verses", "Biblical names", "Christian", "Scripture", "Faith"],
  authors: [{ name: "The Lord Will" }],
  creator: "The Lord Will",
  publisher: "The Lord Will",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://thelordwill.com',
    siteName: "The Lord Will",
    title: "The Lord Will - Biblical Names & Verses",
    description: "Discover the meaning of biblical names and find relevant Bible verses for every situation and profession.",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Lord Will - Biblical Names & Verses",
    description: "Discover the meaning of biblical names and find relevant Bible verses for every situation and profession.",
    creator: "@thelordwill",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://thelordwill.com',
  },
};

// Global JSON-LD Schema
function GlobalSchema() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "The Lord Will",
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://thelordwill.com',
    logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://thelordwill.com'}/logo.png`,
    description: "Biblical names meanings and relevant Bible verses for every situation",
    sameAs: [
      "https://twitter.com/thelordwill",
      "https://facebook.com/thelordwill",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "The Lord Will",
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://thelordwill.com',
    description: "Discover the meaning of biblical names and find relevant Bible verses for every situation and profession.",
    publisher: {
      "@type": "Organization",
      name: "The Lord Will",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://thelordwill.com'}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify([organizationSchema, websiteSchema]),
      }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${serifHeading.variable} ${serifBody.variable}`}>
      <head>
        <GlobalSchema />
      </head>
      <body
        className="font-body antialiased bg-background text-foreground selection:bg-accent/30"
        suppressHydrationWarning
      >
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}