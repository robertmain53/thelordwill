import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Privacy Policy - The Lord Will",
  description: "How The Lord Will collects, uses, and protects your information.",
  alternates: {
    canonical: getCanonicalUrl("/privacy"),
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen py-12 px-4">
      <article className="max-w-4xl mx-auto space-y-10">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground">
            This policy describes how we handle information when you use The Lord Will.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Information we collect</h2>
          <p className="text-muted-foreground">
            We collect limited usage data and any information you provide through forms.
            We do not sell personal data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">How we use information</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>Operate and improve the site.</li>
            <li>Respond to inquiries and provide requested information.</li>
            <li>Protect the security and integrity of the service.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Your rights</h2>
          <p className="text-muted-foreground">
            You may request access, correction, or deletion of your personal data by
            contacting us.
          </p>
        </section>
      </article>
    </main>
  );
}
