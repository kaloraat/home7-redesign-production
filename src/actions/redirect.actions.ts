"use server";

import { revalidatePath } from "next/cache";
import { redirect as nextRedirect } from "next/navigation";
import dbConnect from "@/lib/db";
import Redirect from "@/models/Redirect";
import { auth } from "@/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authorized");
  }
}

function normalizePath(input: string) {
  const trimmed = input.trim();
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function parseFields(formData: FormData) {
  const fromPath = String(formData.get("fromPath") || "").trim();
  const toPath = String(formData.get("toPath") || "").trim();
  const statusCode = Number(formData.get("statusCode") || 301) as 301 | 302;

  if (!fromPath || !toPath) {
    throw new Error("Both paths are required");
  }
  if (fromPath === toPath) {
    throw new Error("From and To can't be the same path — that's a redirect loop");
  }

  return {
    fromPath: normalizePath(fromPath),
    toPath: normalizePath(toPath),
    statusCode: statusCode === 302 ? 302 : 301,
    note: String(formData.get("note") || "").trim() || undefined,
  } as const;
}

export async function createRedirect(formData: FormData) {
  await requireAdmin();
  await dbConnect();

  const fields = parseFields(formData);
  const existing = await Redirect.exists({ fromPath: fields.fromPath });
  if (existing) {
    throw new Error(`A redirect from ${fields.fromPath} already exists`);
  }

  await Redirect.create(fields);
  revalidatePath("/admin/redirects");
  nextRedirect("/admin/redirects");
}

export async function updateRedirect(id: string, formData: FormData) {
  await requireAdmin();
  await dbConnect();

  const fields = parseFields(formData);
  await Redirect.findByIdAndUpdate(id, fields);
  revalidatePath("/admin/redirects");
  nextRedirect("/admin/redirects");
}

export async function deleteRedirect(id: string) {
  await requireAdmin();
  await dbConnect();
  await Redirect.findByIdAndDelete(id);
  revalidatePath("/admin/redirects");
}
