import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dbConnect from "@/lib/db";
import PropertyReference from "@/models/PropertyReference";
import TenancyReferenceForm from "@/components/TenancyReferenceForm";

export const metadata: Metadata = {
  title: "Property Reference Request",
  robots: { index: false, follow: false },
};

async function getReference(token: string) {
  await dbConnect();
  return await PropertyReference.findOne({ token }).lean();
}

// Public but not indexable/discoverable — reached only via the unique
// tokenized link emailed to a tenant's previous agent (see
// notifyTenancyReference.ts). No admin auth here on purpose: the person
// filling this out works at a different agency, not Home7.
export default async function TenancyReferencePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const reference = await getReference(token);
  if (!reference) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-20">
      <h1 className="font-display text-2xl sm:text-3xl text-brand-navy text-center">
        Property Reference Request
      </h1>
      <p className="mt-2 text-center text-slate-500">
        for {reference.tenantName}
      </p>

      <div className="mt-8">
        {reference.status === "pending" ? (
          <TenancyReferenceForm
            token={token}
            tenantName={reference.tenantName}
            tenantAddress={reference.tenantAddress}
            requestedAt={new Date(reference.createdAt).toLocaleDateString("en-AU")}
            agentName={reference.agentName}
            jobPosition={reference.jobPosition}
            agencyName={reference.agencyName}
            agentEmail={reference.agentEmail}
          />
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
            <p className="font-display text-xl text-brand-navy">This request has already been completed</p>
            <p className="mt-2 text-slate-500">There&apos;s nothing more to do here — thanks for your help.</p>
          </div>
        )}
      </div>
    </div>
  );
}
