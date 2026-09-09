"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import { auth } from "@/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authorized");
  }
}

export async function updateLeadStatus(id: string, status: "new" | "contacted" | "closed") {
  await requireAdmin();
  await dbConnect();
  await Lead.findByIdAndUpdate(id, { status });
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${id}`);
}

export async function deleteLead(id: string) {
  await requireAdmin();
  await dbConnect();
  await Lead.findByIdAndDelete(id);
  revalidatePath("/admin/leads");
}
