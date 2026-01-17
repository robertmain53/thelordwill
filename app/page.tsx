import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "The Lord Will - Biblical Wisdom & Holy Land Tours",
 description: "Discover biblical names, Bible verses for every situation and profession, sacred places in Scripture, and practical Bible travel itineraries for Holy Land trips.",
  openGraph: {
    title: "The Lord Will - Biblical Wisdom & Holy Land Tours",
    description: "Discover biblical names, verses for life's moments, sacred places, and practical Bible travel itineraries for Holy Land trips.",  },
  twitter: {
    title: "The Lord Will - Biblical Wisdom & Holy Land Tours",
    description: "Biblical names, verses for life's moments, sacred places, and Bible travel itineraries for Holy Land trips.",  },
};

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-5xl mx-auto text-center space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          The Lord Will
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover the meaning of biblical names, find comfort in Scripture,
          and walk where Jesus walked in the Holy Land.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mt-12">
          <Link
            href="/bible-places"
            className="p-6 border-2 rounded-lg hover:shadow-xl hover:border-blue-500 transition-all group"
          >
            <div className="text-4xl mb-4">🏛️</div>
            <h2 className="text-2xl font-semibold mb-3 group-hover:text-blue-600">
              Biblical Places
            </h2>
            <p className="text-muted-foreground">
              Explore sacred sites from Scripture and plan your Christian pilgrimage.
            </p>
          </Link>

                   <Link
           href="/bible-travel"
            className="p-6 border-2 rounded-lg hover:shadow-xl hover:border-blue-500 transition-all group"
          >
            <div className="text-4xl mb-4">🧭</div>
            <h2 className="text-2xl font-semibold mb-3 group-hover:text-blue-600">
              Bible Travel
            </h2>
            <p className="text-muted-foreground">
              Ready-to-use pilgrimage itineraries with daily readings and practical planning notes.
            </p>
          </Link>

          <Link
            href="/bible-verses-for/anxiety"
            className="p-6 border-2 rounded-lg hover:shadow-xl hover:border-blue-500 transition-all group"
          >
            <div className="text-4xl mb-4">📖</div>
            <h2 className="text-2xl font-semibold mb-3 group-hover:text-blue-600">
              Verses for Situations
            </h2>
            <p className="text-muted-foreground">
              Find comfort and guidance through Bible verses for life's moments.
            </p>
          </Link>

          <Link
            href="/bible-verses-for/teachers"
            className="p-6 border-2 rounded-lg hover:shadow-xl hover:border-blue-500 transition-all group"
          >
            <div className="text-4xl mb-4">💼</div>
            <h2 className="text-2xl font-semibold mb-3 group-hover:text-blue-600">
              Verses for Professions
            </h2>
            <p className="text-muted-foreground">
              Discover biblical wisdom relevant to your profession and calling.
            </p>
          </Link>

          <Link
            href="/meaning-of-john-in-the-bible"
            className="p-6 border-2 rounded-lg hover:shadow-xl hover:border-blue-500 transition-all group"
          >
            <div className="text-4xl mb-4">✨</div>
            <h2 className="text-2xl font-semibold mb-3 group-hover:text-blue-600">
              Biblical Names
            </h2>
            <p className="text-muted-foreground">
              Explore the deep meanings behind biblical names and their significance.
            </p>
          </Link>
        </div>

        {/* Quick Links Section */}
        <div className="mt-16 pt-8 border-t">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Popular Pages</h3>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/bible-places/jerusalem" className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors text-sm font-medium">
              Jerusalem
            </Link>
            <Link href="/about" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm font-medium">
              About Us
            </Link>
            <Link href="/editorial-process" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm font-medium">
              Editorial Process
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
