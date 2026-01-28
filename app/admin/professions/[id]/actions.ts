"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runQualityChecks } from "@/lib/quality/checks";

function toStr(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function updateProfession(id: string, formData: FormData) {
  await requireAdmin();
  const title = toStr(formData.get("title"));
  const slug = toStr(formData.get("slug"));
  const description = toStr(formData.get("description"));
  const content = toStr(formData.get("content")) || null;
  const metaTitle = toStr(formData.get("metaTitle")) || null;
  const metaDescription = toStr(formData.get("metaDescription")) || null;

  if (!title || !slug || !description) {
    throw new Error("Missing required fields: title, slug, description.");
  }

  await prisma.profession.update({
    where: { id },
    data: {
      title,
      slug,
      description,
      content,
      metaTitle,
      metaDescription,
    },
  });

  revalidatePath("/admin/professions");
  revalidatePath(`/admin/professions/${id}`);
  revalidatePath(`/bible-verses-for/${slug}`);

  }

export async function publishProfession(id: string) {
  await requireAdmin();
  // Fetch the record for quality check
  const record = await prisma.profession.findUnique({
    where: { id },
    select: {
      title: true,
      description: true,
      content: true,
      slug: true,
    },
  });

  if (!record) {
    redirect(`/admin/professions/${id}?error=not_found`);
  }

  // Run quality checks
  const result = runQualityChecks({
    entityType: "profession",
    record,
  });

  // Block publishing if quality check fails
  if (!result.ok) {
    const errorMessage = `QUALITY_GATE_FAILED: ${result.reasons.join("; ")}`;
    redirect(
      `/admin/professions/${id}?quality_error=${encodeURIComponent(errorMessage)}`
    );
  }

  // Quality passed, publish the record
  const profession = await prisma.profession.update({
    where: { id },
    data: {
      status: "published",
      publishedAt: new Date(),
    },
    select: { slug: true },
  });

  revalidatePath("/admin/professions");
  revalidatePath(`/admin/professions/${id}`);
  revalidatePath(`/bible-verses-for/${profession.slug}`);

  }

export async function unpublishProfession(id: string) {
  await requireAdmin();
  const profession = await prisma.profession.update({
    where: { id },
    data: {
      status: "draft",
      publishedAt: null,
    },
    select: { slug: true },
  });

  revalidatePath("/admin/professions");
  revalidatePath(`/admin/professions/${id}`);
  revalidatePath(`/bible-verses-for/${profession.slug}`);

  }

export async function deleteProfession(id: string) {
  await requireAdmin();
  const existing = await prisma.profession.findUnique({ where: { id }, select: { slug: true } });
  await prisma.profession.delete({ where: { id } });

  revalidatePath("/admin/professions");
  if (existing?.slug) revalidatePath(`/bible-verses-for/${existing.slug}`);

  redirect("/admin/professions?deleted=1");
}
