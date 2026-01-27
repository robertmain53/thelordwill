import type { Metadata } from "next";
import Link from "next/link";
import { getHubLinks } from "@/lib/internal-linking";

export const metadata: Metadata = {
  title: "The Lord Will - Biblical Wisdom & Holy Land Tours",
  description:
    "Discover biblical names, Bible verses for every situation and profession, sacred places in Scripture, and practical Bible travel itineraries for Holy Land trips.",
  openGraph: {
    title: "The Lord Will - Biblical Wisdom & Holy Land Tours",
    description:
      "Discover biblical names, verses for life's moments, sacred places, and practical Bible travel itineraries for Holy Land trips.",
  },
  twitter: {
    title: "The Lord Will - Biblical Wisdom & Holy Land Tours",
    description:
      "Biblical names, verses for life's moments, sacred places, and Bible travel itineraries for Holy Land trips.",
  },
};

export default function Home() {
  // Get hub links deterministically - ensures Home → Hub depth of 1
  const hubLinks = getHubLinks();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-5xl mx-auto text-center space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          The Lord Will
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover the meaning of biblical names, find comfort in Scripture, and
          walk where Jesus walked in the Holy Land.
        </p>

        {/* Primary Hub Links - Depth 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {hubLinks.map((hub) => (
            <Link
              key={hub.href}
              href={hub.href}
              className="p-6 border-2 rounded-lg hover:shadow-xl hover:border-blue-500 transition-all group"
            >
              <div className="text-4xl mb-4">{hub.icon}</div>
              <h2 className="text-2xl font-semibold mb-3 group-hover:text-blue-600">
                {hub.label}
              </h2>
              <p className="text-muted-foreground">{hub.description}</p>
            </Link>
          ))}
        </div>

        {/* Quick Links Section - Popular deep pages for direct access */}
        <div className="mt-16 pt-8 border-t">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">
            Popular Pages
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/bible-places/jerusalem"
              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              Jerusalem
            </Link>
            <Link
              href="/prayer-points/today"
              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              Today&apos;s Prayer
            </Link>
            <Link
              href="/bible-travel"
              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              Travel Itineraries
            </Link>
            <Link
              href="/about"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              About Us
            </Link>
            <Link
              href="/editorial-process"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Editorial Process
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
