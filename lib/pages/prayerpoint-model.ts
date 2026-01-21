// lib/pages/prayerpoint-model.ts

export type PrayerPointVerseCard = {
  verseId: number;
  reference: string;        // "Philippians 4:6–7"
  text: string;             // KJV or WEB
  relevanceScore: number;   // 1–100
  whyItApplies?: string;    // 1–2 sentences
  strongsTop?: Array<{ strongsId: string; transliteration: string; shortDef: string }>;
};

export type PrayerPointCluster = {
  key: "stabilization" | "identity" | "wisdom" | "endurance";
  title: string;
  intent: string;           // one line: what this cluster does
  verses: PrayerPointVerseCard[];
};

export type PrayerPointToolkit = {
  pray60s: string;
  pray5m: string;
  pray15m: string;
  plan7Days: Array<{ day: number; focus: string; prayer: string; readings: string[] }>;
};

export type PrayerPointPageModel = {
  slug: string;
  title: string;
  description: string;      // metaDescription
  category?: string | null;
  lastUpdatedISO: string;

  primaryVerse?: PrayerPointVerseCard; // top mapping
  clusters: PrayerPointCluster[];

  actionCard: {
    intentLine: string;     // e.g. "Ask God for..."
    prayerNow: string;      // short prayer (80–130 words)
    primaryVerseRef?: string;
  };

  guardrails: {
    contextNote: string;    // 80–150 words
    whenNotToUse: string[]; // 3–5 bullets
    pastoralCaution?: string;
  };

  toolkit: PrayerPointToolkit;

  faqs: Array<{ question: string; answer: string }>;

  // Linking
  nextBest: Array<{ href: string; title: string; why: string }>;
  related: Array<{ href: string; title: string; why: string }>;
};
