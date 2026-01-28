import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Terms of Service - The Lord Will",
  description: "Terms and conditions for using The Lord Will.",
  alternates: {
    canonical: getCanonicalUrl("/terms"),
  },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen py-12 px-4">
      <article className="max-w-4xl mx-auto space-y-10">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold">Terms of Service</h1>
          <p className="text-muted-foreground">
            By accessing or using The Lord Will, you agree to the terms below.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Use of the site</h2>
          <p className="text-muted-foreground">
            You may use the site for personal, non-commercial purposes. Do not misuse,
            disrupt, or attempt to gain unauthorized access to the service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Content</h2>
          <p className="text-muted-foreground">
            Content is provided for informational and devotional purposes. While we
            strive for accuracy, we make no guarantees about completeness or suitability.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Changes</h2>
          <p className="text-muted-foreground">
            We may update these terms at any time. Continued use of the site means you
            accept the updated terms.
          </p>
        </section>
      </article>
    </main>
  );
}
