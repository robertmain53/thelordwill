"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runQualityChecks } from "@/lib/quality/checks";

function toStr(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function toInt(v: string, fallback: number): number {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function toFloatOrNull(v: string): number | null {
  const s = v.trim();
  if (!s) return null;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function toBool(v: string): boolean {
  return v === "on" || v === "true" || v === "1";
}

function normalizeStatus(v: string): "draft" | "published" {
  return v === "published" ? "published" : "draft";
}

export async function updatePlace(id: string, formData: FormData) {
  await requireAdmin();
  // Required fields
  const slug = toStr(formData.get("slug"));
  const name = toStr(formData.get("name"));
  const description = toStr(formData.get("description"));

  if (!slug || !name || !description) {
    throw new Error("Missing required fields: slug, name, description.");
  }

  const status = normalizeStatus(toStr(formData.get("status")));
  const tourPriority = toInt(toStr(formData.get("tourPriority")), 50);

  const data = {
    slug,
    name,
    description,
    historicalInfo: toStr(formData.get("historicalInfo")) || null,
    biblicalContext: toStr(formData.get("biblicalContext")) || null,
    modernName: toStr(formData.get("modernName")) || null,
    country: toStr(formData.get("country")) || null,
    region: toStr(formData.get("region")) || null,
    latitude: toFloatOrNull(toStr(formData.get("latitude"))),
    longitude: toFloatOrNull(toStr(formData.get("longitude"))),
    metaTitle: toStr(formData.get("metaTitle")) || null,
    metaDescription: toStr(formData.get("metaDescription")) || null,
    tourHighlight: toBool(toStr(formData.get("tourHighlight"))),
    tourPriority,
    status,
    publishedAt:
      status === "published"
        ? (await prisma.place.findUnique({ where: { id }, select: { publishedAt: true } }))?.publishedAt ?? new Date()
        : null,
  };

  await prisma.place.update({
    where: { id },
    data,
  });

  revalidatePath("/admin/places");
  revalidatePath(`/admin/places/${id}`);

  // Public pages (both list and detail)
  revalidatePath("/bible-places");
  revalidatePath(`/bible-places/${slug}`);
}

export async function publishPlace(id: string) {
  await requireAdmin();
  // Fetch the record for quality check
  const record = await prisma.place.findUnique({
    where: { id },
    select: {
      name: true,
      description: true,
      historicalInfo: true,
      biblicalContext: true,
      slug: true,
    },
  });

  if (!record) {
    redirect(`/admin/places/${id}?error=not_found`);
  }

  // Run quality checks
  const result = runQualityChecks({
    entityType: "place",
    record,
  });

  // Block publishing if quality check fails
  if (!result.ok) {
    const errorMessage = `QUALITY_GATE_FAILED: ${result.reasons.join("; ")}`;
    redirect(
      `/admin/places/${id}?quality_error=${encodeURIComponent(errorMessage)}`
    );
  }

  // Quality passed, publish the record
  const place = await prisma.place.update({
    where: { id },
    data: {
      status: "published",
      publishedAt: new Date(),
    },
    select: { slug: true },
  });

  revalidatePath("/admin/places");
  revalidatePath(`/admin/places/${id}`);
  revalidatePath("/bible-places");
  revalidatePath(`/bible-places/${place.slug}`);
}

export async function unpublishPlace(id: string) {
  await requireAdmin();
  const place = await prisma.place.update({
    where: { id },
    data: {
      status: "draft",
      publishedAt: null,
    },
    select: { slug: true },
  });

  revalidatePath("/admin/places");
  revalidatePath(`/admin/places/${id}`);
  revalidatePath("/bible-places");
  revalidatePath(`/bible-places/${place.slug}`);
}

export async function deletePlace(id: string) {
  await requireAdmin();
  const existing = await prisma.place.findUnique({ where: { id }, select: { slug: true } });
  await prisma.place.delete({ where: { id } });

  revalidatePath("/admin/places");
  revalidatePath("/bible-places");
  if (existing?.slug) revalidatePath(`/bible-places/${existing.slug}`);

  redirect("/admin/places?deleted=1");
}
