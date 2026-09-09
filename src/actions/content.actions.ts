"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import Content from "@/models/Content";
import { auth } from "@/auth";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authorized");
  }
}

function publicPath(urlPath: "blog" | "root" | "suburb", slug: string) {
  if (urlPath === "blog") return `/blog/${slug}`;
  if (urlPath === "suburb") return `/suburb/${slug}`;
  return `/${slug}`;
}

function parseFields(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const bodyHtml = String(formData.get("bodyHtml") || "").trim();
  const urlPath = String(formData.get("urlPath") || "blog") as "blog" | "root" | "suburb";
  const status = String(formData.get("status") || "draft") as "draft" | "published";

  if (!title || !bodyHtml) {
    throw new Error("Title and content are required");
  }

  return {
    title,
    bodyHtml,
    urlPath,
    status,
    excerpt: String(formData.get("excerpt") || "").trim() || undefined,
    coverImage: String(formData.get("coverImage") || "").trim() || undefined,
    seoTitle: String(formData.get("seoTitle") || "").trim() || undefined,
    seoDescription: String(formData.get("seoDescription") || "").trim() || undefined,
    targetSuburb: String(formData.get("targetSuburb") || "").trim() || undefined,
    // publishedAt is set once, the first time a post goes live — not
    // touched again by later edits, so re-saving a published post doesn't
    // silently bump its date and make it look freshly posted.
  };
}

export async function createContent(formData: FormData) {
  await requireAdmin();
  await dbConnect();

  const fields = parseFields(formData);
  const urlPath = fields.urlPath;
  let slug = slugify(fields.title);

  let n = 2;
  while (await Content.exists({ slug, urlPath })) {
    slug = `${slugify(fields.title)}-${n}`;
    n++;
  }

  await Content.create({
    slug,
    ...fields,
    publishedAt: fields.status === "published" ? new Date() : undefined,
    source: "manual",
  });

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(publicPath(urlPath, slug));
  redirect("/admin/blog?created=1");
}

export async function updateContent(id: string, formData: FormData) {
  await requireAdmin();
  await dbConnect();

  const fields = parseFields(formData);
  const existing = await Content.findById(id);
  if (!existing) {
    throw new Error("Content not found");
  }

  // Slug/urlPath intentionally never change on edit — once /blog/{slug} (or
  // /{slug}) is live, it stays live. Same reasoning as Property/Agent edits.
  const wasPublished = existing.status === "published";
  await Content.findByIdAndUpdate(id, {
    title: fields.title,
    bodyHtml: fields.bodyHtml,
    status: fields.status,
    excerpt: fields.excerpt,
    coverImage: fields.coverImage,
    seoTitle: fields.seoTitle,
    seoDescription: fields.seoDescription,
    targetSuburb: fields.targetSuburb,
    // Only stamps publishedAt the first time a post transitions to
    // published — editing an already-published post again doesn't reset it.
    ...(fields.status === "published" && !wasPublished ? { publishedAt: new Date() } : {}),
  });

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(publicPath(existing.urlPath, existing.slug));
  redirect("/admin/blog");
}

export async function deleteContent(id: string) {
  await requireAdmin();
  await dbConnect();
  const existing = await Content.findById(id);
  if (!existing) return;

  await Content.findByIdAndDelete(id);

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(publicPath(existing.urlPath, existing.slug));
}
