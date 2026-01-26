// app/admin/travel-itineraries/new/actions.ts
"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function toStr(v: FormDataEntryValue | null, max: number): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

function toInt(v: FormDataEntryValue | null, fallback: number): number {
  const n = Number(typeof v === "string" ? v : "");
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : fallback;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let i = 2;
  while (true) {
    const exists = await prisma.travelItinerary.findUnique({ where: { slug } });
    if (!exists) return slug;
    slug = `${baseSlug}-${i++}`.slice(0, 200);
  }
}

export async function createItinerary(formData: FormData) {
  const title = toStr(formData.get("title"), 200);
  const region = toStr(formData.get("region"), 200);
  const days = toInt(formData.get("days"), 0);
  const metaTitle = toStr(formData.get("metaTitle"), 200);
  const metaDescription = toStr(formData.get("metaDescription"), 500);
  const bestSeason = toStr(formData.get("bestSeason"), 200);
  const whoItsFor = toStr(formData.get("whoItsFor"), 500);
  const highlightsRaw = toStr(formData.get("highlights"), 2000);
  const providedSlug = toStr(formData.get("slug"), 200);

  const highlights = highlightsRaw
    ? highlightsRaw.split(",").map((h) => h.trim()).filter(Boolean)
    : [];

  const baseSlug = slugify(providedSlug || title || "");

  if (!title || !region || days <= 0 || !baseSlug) {
    redirect("/admin/travel-itineraries/new?error=missing");
  }

  // Check for duplicate slug
  const existing = await prisma.travelItinerary.findUnique({ where: { slug: baseSlug } });
  if (existing && providedSlug) {
    redirect("/admin/travel-itineraries/new?error=duplicate");
  }

  const slug = await ensureUniqueSlug(baseSlug);

  const created = await prisma.travelItinerary.create({
    data: {
      title,
      slug,
      days,
      region,
      metaTitle,
      metaDescription,
      bestSeason,
      whoItsFor,
      highlights,
      status: "draft",
    },
    select: { id: true },
  });

  revalidatePath("/admin/travel-itineraries");
  redirect(`/admin/travel-itineraries/${created.id}?created=1`);
}
