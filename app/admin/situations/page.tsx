// app/admin/situations/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminSituationsPage() {
  const situations = await prisma.situation.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Situations</h1>
        <div className="text-sm text-muted-foreground">
          {situations.length} situations
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Title</th>
              <th className="text-left px-4 py-2 font-medium">Slug</th>
              <th className="text-left px-4 py-2 font-medium">Category</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium">Updated</th>
              <th className="text-left px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {situations.map((s) => (
              <tr key={s.id} className="hover:bg-muted/50">
                <td className="px-4 py-2">{s.title}</td>
                <td className="px-4 py-2 text-muted-foreground">{s.slug}</td>
                <td className="px-4 py-2">{s.category || "-"}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex px-2 py-0.5 text-xs rounded ${
                      s.status === "published"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {s.updatedAt.toISOString().slice(0, 10)}
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/admin/situations/${s.id}`}
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
