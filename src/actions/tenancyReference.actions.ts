"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import PropertyReference from "@/models/PropertyReference";
import { auth } from "@/auth";
import { sendReferenceRequestEmail } from "@/lib/notifyTenancyReference";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authorized");
  }
}

export async function createReferenceRequest(formData: FormData) {
  await requireAdmin();
  await dbConnect();

  const tenantName = String(formData.get("tenantName") || "").trim();
  const tenantAddress = String(formData.get("tenantAddress") || "").trim();
  const agentEmail = String(formData.get("agentEmail") || "").trim();
  const agentName = String(formData.get("agentName") || "").trim();
  const jobPosition = String(formData.get("jobPosition") || "").trim() || undefined;
  const agencyName = String(formData.get("agencyName") || "").trim();

  if (!tenantName || !tenantAddress || !agentEmail || !agentName || !agencyName) {
    throw new Error("Tenant name, address, agency name, and the agent's name and email are required");
  }

  const reference = await PropertyReference.create({
    tenantName,
    tenantAddress,
    agentEmail,
    agentName,
    jobPosition,
    agencyName,
    token: randomUUID(),
    status: "pending",
  });

  // Awaited (not fire-and-forget) — same reasoning as notifyLead's usage in
  // /api/leads: this may run in a serverless function that gets torn down
  // the instant the response is sent, so an un-awaited async call risks
  // never completing.
  await sendReferenceRequestEmail(reference);

  revalidatePath("/admin/tenancy-checks");
  redirect("/admin/tenancy-checks?created=1");
}
