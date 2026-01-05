import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description: "Discover the meaning of biblical names and find relevant Bible verses for every situation and profession.",
  openGraph: {
    title: "The Lord Will - Biblical Names & Verses",
    description: "Discover the meaning of biblical names and find relevant Bible verses for every situation and profession.",
  },
  twitter: {
    title: "The Lord Will - Biblical Names & Verses",
    description: "Discover the meaning of biblical names and find relevant Bible verses for every situation and profession.",
  },
};

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          The Lord Will
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover the meaning of biblical names and find relevant Bible verses
          for every situation and profession.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold mb-3">Biblical Names</h2>
            <p className="text-muted-foreground">
              Explore the deep meanings behind biblical names and their significance.
            </p>
          </div>

          <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold mb-3">Verses for Situations</h2>
            <p className="text-muted-foreground">
              Find comfort and guidance through Bible verses for life's moments.
            </p>
          </div>

          <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold mb-3">Verses for Professions</h2>
            <p className="text-muted-foreground">
              Discover biblical wisdom relevant to your profession and calling.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
