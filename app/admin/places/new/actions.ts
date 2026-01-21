"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function toStr(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function normalizeStatus(v: string): "draft" | "published" {
  return v === "published" ? "published" : "draft";
}

export async function createPlace(formData: FormData) {
  const slug = toStr(formData.get("slug"));
  const name = toStr(formData.get("name"));
  const description = toStr(formData.get("description"));
  const status = normalizeStatus(toStr(formData.get("status")));

  if (!slug || !name || !description) {
    throw new Error("Missing required fields: slug, name, description.");
  }

  const created = await prisma.place.create({
    data: {
      slug,
      name,
      description,
      status,
      publishedAt: status === "published" ? new Date() : null,
    },
    select: { id: true },
  });

  revalidatePath("/admin/places");
  revalidatePath("/bible-places");

  redirect(`/admin/places/${created.id}`);
}
