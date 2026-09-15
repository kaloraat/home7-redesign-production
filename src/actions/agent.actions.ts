"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import Agent from "@/models/Agent";
import { requireAdmin, requireOwner } from "@/lib/authz";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function numberOrUndefined(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  if (!str) return undefined;
  const n = Number(str);
  return Number.isFinite(n) ? n : undefined;
}

function parseFields(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "").trim();

  if (!name || !role) {
    throw new Error("Name and role are required");
  }

  return {
    name,
    role,
    phone: String(formData.get("phone") || "").trim() || undefined,
    mobile: String(formData.get("mobile") || "").trim() || undefined,
    whatsapp: String(formData.get("whatsapp") || "").trim() || undefined,
    email: String(formData.get("email") || "").trim() || undefined,
    photo: String(formData.get("photo") || "").trim() || undefined,
    facebook: String(formData.get("facebook") || "").trim() || undefined,
    linkedin: String(formData.get("linkedin") || "").trim() || undefined,
    bio: String(formData.get("bio") || "").trim() || undefined,
    order: numberOrUndefined(formData.get("order")) ?? 0,
    active: formData.get("active") === "on",
  };
}

export async function createAgent(formData: FormData) {
  await requireAdmin();
  await dbConnect();

  const fields = parseFields(formData);
  let slug = slugify(fields.name);

  // De-dupe, same pattern as property/blog slugs — append -2, -3, … rather
  // than fail outright, since two agents can legitimately share a name.
  let n = 2;
  while (await Agent.exists({ slug })) {
    slug = `${slugify(fields.name)}-${n}`;
    n++;
  }

  await Agent.create({ slug, ...fields });

  revalidatePath("/admin/agents");
  revalidatePath("/agents");
  redirect("/admin/agents");
}

export async function updateAgent(id: string, formData: FormData) {
  await requireAdmin();
  await dbConnect();

  const fields = parseFields(formData);
  const existing = await Agent.findById(id);
  if (!existing) {
    throw new Error("Agent not found");
  }

  // Slug isn't regenerated on edit — same reasoning as properties: once an
  // /agent/{slug} URL is live, editing the name shouldn't silently move it.
  await Agent.findByIdAndUpdate(id, fields);

  revalidatePath("/admin/agents");
  revalidatePath("/agents");
  revalidatePath(`/agent/${existing.slug}`);
  redirect("/admin/agents");
}

export async function deleteAgent(id: string) {
  await requireOwner();
  await dbConnect();
  await Agent.findByIdAndDelete(id);
  revalidatePath("/admin/agents");
  revalidatePath("/agents");
}
