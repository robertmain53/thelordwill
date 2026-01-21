// app/admin/prayer-points/[id]/actions.ts
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

export async function updatePrayerPointById(id: string, formData: FormData) {
  const title = toStr(formData.get("title"), 200);
  const slug = toStr(formData.get("slug"), 200);
  const description = toStr(formData.get("description"), 5000);
  const content = toStr(formData.get("content"), 200000); // HTML allowed
  const metaTitle = toStr(formData.get("metaTitle"), 200);
  const metaDescription = toStr(formData.get("metaDescription"), 500);
  const category = toStr(formData.get("category"), 120);
  const priority = toInt(formData.get("priority"), 50);
  const dailyRotation = formData.get("dailyRotation") === "on";

  if (!title || !slug || !description) {
    redirect(`/admin/prayer-points/${id}?error=missing`);
  }

  await prisma.prayerPoint.update({
    where: { id },
    data: {
      title,
      slug,
      description,
      content,
      metaTitle,
      metaDescription,
      category,
      priority,
      dailyRotation,
    },
  });

  redirect(`/admin/prayer-points/${id}?saved=1`);
}

export async function publishPrayerPointById(id: string) {
  await prisma.prayerPoint.update({
    where: { id },
    data: {
      status: "published",
      publishedAt: new Date(),
    },
  });

  redirect(`/admin/prayer-points/${id}?published=1`);
}

export async function unpublishPrayerPointById(id: string) {
  await prisma.prayerPoint.update({
    where: { id },
    data: {
      status: "draft",
      publishedAt: null,
    },
  });

  redirect(`/admin/prayer-points/${id}?unpublished=1`);
}

export async function deletePrayerPointById(id: string) {
  await prisma.prayerPoint.delete({ where: { id } });
  redirect(`/admin/prayer-points?deleted=1`);
}
