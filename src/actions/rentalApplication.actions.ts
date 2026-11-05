"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import TenancyApplication from "@/models/TenancyApplication";
import { requireAdmin, requireOwner } from "@/lib/authz";
import { applicationFiles } from "@/lib/rentalApplication/files";
import { deletePrivate } from "@/lib/s3Private";

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
  const deleted = await TenancyApplication.findByIdAndDelete(id).lean();
  // v2 uploads live in the private bucket: remove them with the record.
  if (deleted?.formVersion === 2 && deleted.v2) {
    await Promise.all(applicationFiles(deleted.v2).map((f) => deletePrivate(f.key)));
  }
  revalidatePath("/admin/rental-applications");
}
