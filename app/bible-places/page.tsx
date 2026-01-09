import type { Metadata } from "next";
import Link from "next/link";
import { PrismaClient } from '@prisma/client';
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getCanonicalUrl } from "@/lib/utils";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PlaceListItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  country: string | null;
  region: string | null;
  tourHighlight: boolean;
  _count: {
    verseMentions: number;
  };
};

export const metadata: Metadata = {
  title: "Biblical Places - Holy Land Sites & Christian Pilgrimage Tours",
  description: "Explore biblical places mentioned in Scripture. Discover the historical and spiritual significance of Jerusalem, Bethlehem, Nazareth, and other Holy Land locations. Plan your Christian pilgrimage.",
  alternates: {
    canonical: getCanonicalUrl("/bible-places"),
  },
  keywords: [
    "biblical places",
    "Holy Land sites",
    "Christian pilgrimage",
    "Bible geography",
    "Israel tours",
    "biblical archaeology",
    "sacred sites",
  ],
};

async function getPlaces(): Promise<PlaceListItem[]> {
  try {
    const places = await prisma.place.findMany({
      orderBy: [
        { tourPriority: 'desc' },
        { name: 'asc' },
      ],
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        country: true,
        region: true,
        tourHighlight: true,
        _count: {
          select: {
            verseMentions: true,
          },
        },
      },
    });

    return places;
  } catch (error) {
    console.error('Error fetching places:', error);
    return [];
  }
}

export default async function BiblePlacesPage() {
  const places = await getPlaces();

  const breadcrumbs = [
    { label: "Home", href: "/", position: 1 },
    { label: "Bible Places", href: "/bible-places", position: 2 },
  ];

  const highlightPlaces = places.filter((p) => p.tourHighlight);
  const otherPlaces = places.filter((p) => !p.tourHighlight);

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={breadcrumbs} />

      {/* Hero Section */}
      <div className="mt-6 mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Biblical Places & Holy Land Tours
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Discover the locations where biblical history unfolded. Explore verses mentioning
          each sacred site and plan your Christian pilgrimage to walk where Jesus walked.
        </p>
      </div>

      {/* Feature Section */}
      <div className="mb-12 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">{places.length}</div>
            <div className="text-gray-700">Biblical Locations</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">800+</div>
            <div className="text-gray-700">Scripture References</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">10,000+</div>
            <div className="text-gray-700">Pilgrims Served</div>
          </div>
        </div>
      </div>

      {/* Highlighted Places */}
      {highlightPlaces.length > 0 && (
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">
            Featured Holy Land Destinations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlightPlaces.map((place) => (
              <Link
                key={place.id}
                href={`/bible-places/${place.slug}`}
                className="group block p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-xl transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600">
                    {place.name}
                  </h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                    Featured
                  </span>
                </div>

                {(place.region || place.country) && (
                  <div className="text-sm text-gray-500 mb-3">
                    {[place.region, place.country].filter(Boolean).join(', ')}
                  </div>
                )}

                <p className="text-gray-700 mb-4 line-clamp-3">
                  {place.description}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {place._count.verseMentions} verse{place._count.verseMentions !== 1 ? 's' : ''}
                  </span>
                  <span className="text-blue-600 font-semibold group-hover:underline">
                    Explore →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Other Places */}
      {otherPlaces.length > 0 && (
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">
            More Biblical Locations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherPlaces.map((place) => (
              <Link
                key={place.id}
                href={`/bible-places/${place.slug}`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {place.name}
                </h3>

                {(place.region || place.country) && (
                  <div className="text-xs text-gray-500 mb-2">
                    {[place.region, place.country].filter(Boolean).join(', ')}
                  </div>
                )}

                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {place.description}
                </p>

                <div className="text-xs text-gray-500">
                  {place._count.verseMentions} verse{place._count.verseMentions !== 1 ? 's' : ''}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {places.length === 0 && (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-600 mb-4">
            No places available yet
          </h2>
          <p className="text-gray-500">
            Biblical places will appear here once they are added to the database.
          </p>
        </div>
      )}

      {/* Call to Action */}
      <section className="mt-16 p-8 bg-blue-600 text-white rounded-lg text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Experience the Holy Land?
        </h2>
        <p className="text-lg mb-6 max-w-2xl mx-auto">
          Join thousands of Christians who have walked in the footsteps of Jesus.
          Our trusted tour partners offer personalized pilgrimage experiences with
          expert biblical guides.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/bible-places/jerusalem"
            className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Explore Jerusalem
          </Link>
          <a
            href="#"
            className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Request Tour Quote
          </a>
        </div>
      </section>
    </div>
  );
}
