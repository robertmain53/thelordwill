// app/admin/prayer-points/new/actions.ts
"use server";

import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";

function toStr(v: FormDataEntryValue | null, max: number) {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

function toInt(v: FormDataEntryValue | null, fallback: number) {
  const n = Number(typeof v === "string" ? v : "");
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

async function ensureUniqueSlug(baseSlug: string) {
  let slug = baseSlug;
  let i = 2;
  // try base, then base-2, base-3...
  while (true) {
    const exists = await prisma.prayerPoint.findUnique({ where: { slug } });
    if (!exists) return slug;
    slug = `${baseSlug}-${i++}`.slice(0, 200);
  }
}

export async function createPrayerPoint(formData: FormData) {
  const title = toStr(formData.get("title"), 200);
  const description = toStr(formData.get("description"), 5000);

  // optional fields
  const category = toStr(formData.get("category"), 120);
  const priority = toInt(formData.get("priority"), 50);
  const dailyRotation = formData.get("dailyRotation") === "on";

  const metaTitle = toStr(formData.get("metaTitle"), 200);
  const metaDescription = toStr(formData.get("metaDescription"), 500);

  const providedSlug = toStr(formData.get("slug"), 200);
  const baseSlug = slugify(providedSlug || title || "");

  if (!title || !description || !baseSlug) {
    redirect(`/admin/prayer-points/new?error=missing`);
  }

  const slug = await ensureUniqueSlug(baseSlug);

  const created = await prisma.prayerPoint.create({
    data: {
      title,
      slug,
      description,
      content: null,
      metaTitle,
      metaDescription,
      category,
      priority,
      dailyRotation,
    },
    select: { id: true },
  });

  redirect(`/admin/prayer-points/${created.id}?created=1`);
}
