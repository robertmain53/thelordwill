// app/admin/travel-itineraries/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminItinerariesPage() {
  const itineraries = await prisma.travelItinerary.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      days: true,
      region: true,
      status: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Travel Itineraries</h1>
        <div className="text-sm text-muted-foreground">
          {itineraries.length} itineraries
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Title</th>
              <th className="text-left px-4 py-2 font-medium">Slug</th>
              <th className="text-left px-4 py-2 font-medium">Days</th>
              <th className="text-left px-4 py-2 font-medium">Region</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium">Updated</th>
              <th className="text-left px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {itineraries.map((i) => (
              <tr key={i.id} className="hover:bg-muted/50">
                <td className="px-4 py-2">{i.title}</td>
                <td className="px-4 py-2 text-muted-foreground">{i.slug}</td>
                <td className="px-4 py-2">{i.days}</td>
                <td className="px-4 py-2">{i.region}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex px-2 py-0.5 text-xs rounded ${
                      i.status === "published"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {i.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {i.updatedAt.toISOString().slice(0, 10)}
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/admin/travel-itineraries/${i.id}`}
                    className="text-primary underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
