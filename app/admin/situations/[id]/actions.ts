"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runQualityChecks } from "@/lib/quality/checks";

function toStr(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function updateSituation(id: string, formData: FormData) {
  const title = toStr(formData.get("title"));
  const slug = toStr(formData.get("slug"));
  const metaDescription = toStr(formData.get("metaDescription"));
  const content = toStr(formData.get("content")) || null;
  const category = toStr(formData.get("category")) || null;

  if (!title || !slug || !metaDescription) {
    throw new Error("Missing required fields: title, slug, metaDescription.");
  }

  await prisma.situation.update({
    where: { id },
    data: {
      title,
      slug,
      metaDescription,
      content,
      category,
    },
  });

  revalidatePath("/admin/situations");
  revalidatePath(`/admin/situations/${id}`);
  revalidatePath(`/bible-verses-for/${slug}`);
}

export async function publishSituation(id: string) {
  // Fetch the record for quality check
  const record = await prisma.situation.findUnique({
    where: { id },
    select: {
      title: true,
      metaDescription: true,
      content: true,
      slug: true,
    },
  });

  if (!record) {
    redirect(`/admin/situations/${id}?error=not_found`);
  }

  // Run quality checks
  const result = runQualityChecks({
    entityType: "situation",
    record,
  });

  // Block publishing if quality check fails
  if (!result.ok) {
    const errorMessage = `QUALITY_GATE_FAILED: ${result.reasons.join("; ")}`;
    redirect(
      `/admin/situations/${id}?quality_error=${encodeURIComponent(errorMessage)}`
    );
  }

  // Quality passed, publish the record
  const situation = await prisma.situation.update({
    where: { id },
    data: {
      status: "published",
      publishedAt: new Date(),
    },
    select: { slug: true },
  });

  revalidatePath("/admin/situations");
  revalidatePath(`/admin/situations/${id}`);
  revalidatePath(`/bible-verses-for/${situation.slug}`);
}

export async function unpublishSituation(id: string) {
  const situation = await prisma.situation.update({
    where: { id },
    data: {
      status: "draft",
      publishedAt: null,
    },
    select: { slug: true },
  });

  revalidatePath("/admin/situations");
  revalidatePath(`/admin/situations/${id}`);
  revalidatePath(`/bible-verses-for/${situation.slug}`);
}

export async function deleteSituation(id: string) {
  const existing = await prisma.situation.findUnique({ where: { id }, select: { slug: true } });
  await prisma.situation.delete({ where: { id } });

  revalidatePath("/admin/situations");
  if (existing?.slug) revalidatePath(`/bible-verses-for/${existing.slug}`);

  redirect("/admin/situations?deleted=1");
}
