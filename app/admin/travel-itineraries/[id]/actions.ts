"use server";

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

export async function updateItinerary(id: string, formData: FormData) {
  const title = toStr(formData.get("title"));
  const slug = toStr(formData.get("slug"));
  const days = toInt(toStr(formData.get("days")), 1);
  const region = toStr(formData.get("region"));
  const bestSeason = toStr(formData.get("bestSeason")) || null;
  const whoItsFor = toStr(formData.get("whoItsFor")) || null;
  const metaTitle = toStr(formData.get("metaTitle")) || null;
  const metaDescription = toStr(formData.get("metaDescription")) || null;
  const content = toStr(formData.get("content")) || null;
  const highlightsRaw = toStr(formData.get("highlights"));
  const highlights = highlightsRaw
    ? highlightsRaw.split(",").map((h) => h.trim()).filter(Boolean)
    : [];

  if (!title || !slug || !region) {
    throw new Error("Missing required fields: title, slug, region.");
  }

  await prisma.travelItinerary.update({
    where: { id },
    data: {
      title,
      slug,
      days,
      region,
      bestSeason,
      whoItsFor,
      metaTitle,
      metaDescription,
      content,
      highlights,
    },
  });

  revalidatePath("/admin/travel-itineraries");
  revalidatePath(`/admin/travel-itineraries/${id}`);
  revalidatePath(`/travel-itineraries/${slug}`);

  }

export async function publishItinerary(id: string) {
  // Fetch the record for quality check
  const record = await prisma.travelItinerary.findUnique({
    where: { id },
    select: {
      title: true,
      metaDescription: true,
      content: true,
      slug: true,
    },
  });

  if (!record) {
    redirect(`/admin/travel-itineraries/${id}?error=not_found`);
  }

  // Run quality checks
  const result = runQualityChecks({
    entityType: "itinerary",
    record,
  });

  // Block publishing if quality check fails
  if (!result.ok) {
    const errorMessage = `QUALITY_GATE_FAILED: ${result.reasons.join("; ")}`;
    redirect(
      `/admin/travel-itineraries/${id}?quality_error=${encodeURIComponent(errorMessage)}`
    );
  }

  // Quality passed, publish the record
  const itinerary = await prisma.travelItinerary.update({
    where: { id },
    data: {
      status: "published",
    },
    select: { slug: true },
  });

  revalidatePath("/admin/travel-itineraries");
  revalidatePath(`/admin/travel-itineraries/${id}`);
  revalidatePath(`/travel-itineraries/${itinerary.slug}`);

  }

export async function unpublishItinerary(id: string) {
  const itinerary = await prisma.travelItinerary.update({
    where: { id },
    data: {
      status: "draft",
    },
    select: { slug: true },
  });

  revalidatePath("/admin/travel-itineraries");
  revalidatePath(`/admin/travel-itineraries/${id}`);
  revalidatePath(`/travel-itineraries/${itinerary.slug}`);

  }

export async function deleteItinerary(id: string) {
  const existing = await prisma.travelItinerary.findUnique({ where: { id }, select: { slug: true } });
  await prisma.travelItinerary.delete({ where: { id } });

  revalidatePath("/admin/travel-itineraries");
  if (existing?.slug) revalidatePath(`/travel-itineraries/${existing.slug}`);

  redirect("/admin/travel-itineraries?deleted=1");
}
