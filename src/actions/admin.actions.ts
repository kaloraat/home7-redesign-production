"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import Admin from "@/models/Admin";
import { auth } from "@/auth";

/**
 * The `role` field ("owner"/"editor") existed on the Admin model from the
 * start but nothing actually used it — every admin action just checked
 * "is there a session at all". This is the first real use of it: only an
 * owner can manage other admin accounts (create/delete/reset password).
 * Everything else in the admin dashboard stays open to any signed-in admin,
 * same as before — this isn't a full permissions rebuild, just the one
 * place where "who can add/remove staff logins" genuinely matters.
 */
async function requireOwner() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authorized");
  }
  if (session.user.role !== "owner") {
    throw new Error("Only an owner can manage admin users");
  }
  return session;
}

export async function createAdminUser(formData: FormData) {
  await requireOwner();
  await dbConnect();

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "editor") === "owner" ? "owner" : "editor";

  if (!name || !email || password.length < 8) {
    throw new Error("Name, email, and a password of at least 8 characters are required");
  }
  if (await Admin.exists({ email })) {
    throw new Error(`An admin with the email ${email} already exists`);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await Admin.create({ name, email, passwordHash, role });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function deleteAdminUser(id: string) {
  const session = await requireOwner();
  await dbConnect();

  const target = await Admin.findById(id);
  if (!target) return;
  if (String(target._id) === session.user.id) {
    throw new Error("You can't delete your own account while signed in as it");
  }

  await Admin.findByIdAndDelete(id);
  revalidatePath("/admin/users");
}

export async function resetAdminPassword(id: string, formData: FormData) {
  await requireOwner();
  await dbConnect();

  const password = String(formData.get("password") || "");
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await Admin.findByIdAndUpdate(id, { passwordHash });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}
