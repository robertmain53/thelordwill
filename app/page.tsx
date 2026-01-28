import type { Metadata } from "next";
import Link from "next/link";
import { getHubLinks, getPopularPrayerPoints, getFeaturedPlaces, getPopularSituations } from "@/lib/internal-linking";

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

export const dynamic = "force-dynamic";

export default async function Home() {
  // Get hub links deterministically - ensures Home → Hub depth of 1
  const hubLinks = getHubLinks();

  // Fetch popular content for direct deep linking (reduces click depth)
  const [popularPrayerPoints, featuredPlaces, popularSituations] = await Promise.all([
    getPopularPrayerPoints(6),
    getFeaturedPlaces(4),
    getPopularSituations(4),
  ]);

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

        {/* Popular Prayer Points - Direct links for reduced click depth */}
        {popularPrayerPoints.length > 0 && (
          <div className="mt-16 pt-8 border-t">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Popular Prayer Topics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {popularPrayerPoints.map((pp) => (
                <Link
                  key={pp.href}
                  href={pp.href}
                  className="p-3 border rounded-lg hover:border-blue-500 hover:shadow-sm transition-all group"
                >
                  <span className="font-medium group-hover:text-blue-600 transition-colors">
                    {pp.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Featured Places - Direct links */}
        {featuredPlaces.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Featured Biblical Places
            </h3>
            <div className="flex flex-wrap gap-3">
              {featuredPlaces.map((place) => (
                <Link
                  key={place.href}
                  href={place.href}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  {place.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Popular Situations - Direct links */}
        {popularSituations.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Bible Verses for Life&apos;s Moments
            </h3>
            <div className="flex flex-wrap gap-3">
              {popularSituations.map((sit) => (
                <Link
                  key={sit.href}
                  href={sit.href}
                  className="px-4 py-2 bg-green-50 text-green-700 rounded-full hover:bg-green-100 transition-colors text-sm font-medium"
                >
                  {sit.title.replace("Verses for ", "")}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links Section - Static pages */}
        <div className="mt-10 pt-6 border-t">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
            Quick Links
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/prayer-points/today"
              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              Today&apos;s Prayer
            </Link>
            <Link
              href="/search"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Search
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
