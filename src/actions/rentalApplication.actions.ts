"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import TenancyApplication from "@/models/TenancyApplication";
import { requireAdmin, requireOwner } from "@/lib/authz";

export async function updateApplicationStatus(
  id: string,
  status: "new" | "reviewed" | "approved" | "declined"
) {
  await requireAdmin();
  await dbConnect();
  await TenancyApplication.findByIdAndUpdate(id, { status });
  revalidatePath("/admin/rental-applications");
  revalidatePath(`/admin/rental-applications/${id}`);
}

export async function deleteApplication(id: string) {
  await requireOwner();
  await dbConnect();
  await TenancyApplication.findByIdAndDelete(id);
  revalidatePath("/admin/rental-applications");
}
