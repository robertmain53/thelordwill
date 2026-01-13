import Link from "next/link";
import { TRAVEL_ITINERARIES } from "@/data/travel-itineraries";

export const dynamic = "force-dynamic";

export default function BibleTravelHubPage() {
  const featured = TRAVEL_ITINERARIES;

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Bible Travel & Pilgrimage Itineraries</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Practical, Scripture-first travel plans designed for real-world pacing. Each itinerary includes daily readings,
            reflection structure, and planning notes.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featured.map((it) => (
            <Link
              key={it.slug}
              href={`/bible-travel/${it.slug}`}
              className="group border rounded-lg p-6 bg-card hover:shadow-md hover:border-primary transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-semibold group-hover:text-primary transition-colors">
                  {it.title}
                </h2>
                <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                  {it.days} days
                </span>
              </div>
              <p className="mt-3 text-muted-foreground">{it.metaDescription}</p>
              <div className="mt-4 text-sm text-muted-foreground">
                Region: <span className="text-foreground">{it.region}</span>
              </div>
            </Link>
          ))}
        </section>

        <section className="mt-10 border rounded-xl p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
          <h2 className="text-2xl font-bold mb-3">Want help planning a discipleship-first tour?</h2>
          <p className="text-muted-foreground mb-6">
            If you are planning for a church group or a first-time pilgrimage, request a quote and we can recommend a practical route.
          </p>
          <Link
            href="/bible-places"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Explore Bible Places
            <span>→</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
