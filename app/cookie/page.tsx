import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Cookie Policy - The Lord Will",
  description: "Learn how The Lord Will uses cookies and similar technologies.",
  alternates: {
    canonical: getCanonicalUrl("/cookie"),
  },
};

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen py-12 px-4">
      <article className="max-w-4xl mx-auto space-y-10">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold">Cookie Policy</h1>
          <p className="text-muted-foreground">
            This policy explains how The Lord Will uses cookies and similar technologies.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">What are cookies?</h2>
          <p className="text-muted-foreground">
            Cookies are small text files stored on your device by websites you visit.
            They help sites remember your preferences and improve your experience.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">How we use cookies</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>Remember site preferences and basic settings.</li>
            <li>Support security and session management for admin tools.</li>
            <li>Understand usage patterns to improve content and navigation.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Your choices</h2>
          <p className="text-muted-foreground">
            You can control cookies through your browser settings. Disabling cookies
            may affect some features of the site.
          </p>
        </section>
      </article>
    </main>
  );
}
