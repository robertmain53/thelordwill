// app/admin/professions/new/actions.ts
"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function toStr(v: FormDataEntryValue | null, max: number): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
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
    const exists = await prisma.profession.findUnique({ where: { slug } });
    if (!exists) return slug;
    slug = `${baseSlug}-${i++}`.slice(0, 200);
  }
}

export async function createProfession(formData: FormData) {
  const title = toStr(formData.get("title"), 200);
  const description = toStr(formData.get("description"), 5000);
  const metaTitle = toStr(formData.get("metaTitle"), 200);
  const metaDescription = toStr(formData.get("metaDescription"), 500);
  const providedSlug = toStr(formData.get("slug"), 200);

  const baseSlug = slugify(providedSlug || title || "");

  if (!title || !description || !baseSlug) {
    redirect("/admin/professions/new?error=missing");
  }

  // Check for duplicate slug
  const existing = await prisma.profession.findUnique({ where: { slug: baseSlug } });
  if (existing && providedSlug) {
    redirect("/admin/professions/new?error=duplicate");
  }

  const slug = await ensureUniqueSlug(baseSlug);

  const created = await prisma.profession.create({
    data: {
      title,
      slug,
      description,
      metaTitle,
      metaDescription,
      status: "draft",
    },
    select: { id: true },
  });

  revalidatePath("/admin/professions");
  redirect(`/admin/professions/${created.id}?created=1`);
}
