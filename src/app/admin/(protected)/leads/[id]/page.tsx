import { notFound } from "next/navigation";
import Link from "next/link";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import { updateLeadStatus, deleteLead } from "@/actions/lead.actions";
import DeleteButton from "@/components/admin/DeleteButton";

const TYPE_LABELS: Record<string, string> = {
  selling: "Selling",
  renting: "Renting",
  buying: "Buying",
  "tenant-application": "Tenant Application",
  "general-contact": "Contact",
  blog: "Blog",
};

const STATUSES = ["new", "contacted", "closed"] as const;

async function getLead(id: string) {
  await dbConnect();
  return await Lead.findById(id).lean();
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();

  return (
    <div className="max-w-2xl">
      <Link href="/admin/leads" className="text-sm text-slate-500 hover:text-brand-navy">
        ← Back to Leads
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-brand-navy">{lead.name}</h1>
          <p className="mt-1 text-slate-500">
            {TYPE_LABELS[lead.type] ?? lead.type} lead ·{" "}
            {new Date(lead.createdAt).toLocaleString("en-AU", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Email</p>
            <a href={`mailto:${lead.email}`} className="text-brand-gold-dark hover:underline">
              {lead.email}
            </a>
          </div>
          {lead.phone && (
            <div>
              <p className="text-slate-400">Phone</p>
              <a href={`tel:${lead.phone}`} className="text-brand-gold-dark hover:underline">
                {lead.phone}
              </a>
            </div>
          )}
          {lead.suburb && (
            <div>
              <p className="text-slate-400">Suburb / Address</p>
              <p className="text-slate-700">{lead.suburb}</p>
            </div>
          )}
        </div>

        {lead.message && (
          <div>
            <p className="text-sm text-slate-400 mb-1">Message</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap rounded bg-slate-50 border border-slate-100 p-3">
              {lead.message}
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-sm font-medium text-slate-900 mb-3">Status</p>
        <div className="flex gap-2">
          {STATUSES.map((s) => (
            <form
              key={s}
              action={async () => {
                "use server";
                await updateLeadStatus(id, s);
              }}
            >
              <button
                type="submit"
                disabled={lead.status === s}
                className={`rounded px-4 py-2 text-sm font-medium transition-colors cursor-pointer disabled:cursor-default ${
                  lead.status === s
                    ? "bg-brand-navy text-white"
                    : "border border-slate-300 text-slate-600 hover:border-brand-gold-dark"
                }`}
              >
                {s === "new" ? "New" : s === "contacted" ? "Contacted" : "Closed"}
              </button>
            </form>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <DeleteButton
          onConfirm={deleteLead.bind(null, id)}
          itemLabel="this lead"
          after={{ mode: "redirect", to: "/admin/leads" }}
          className="text-sm text-red-600 hover:underline cursor-pointer"
        />
      </div>
    </div>
  );
}
