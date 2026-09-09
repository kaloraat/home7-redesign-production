import Link from "next/link";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
] as const;

const TYPE_LABELS: Record<string, string> = {
  selling: "Selling",
  renting: "Renting",
  buying: "Buying",
  "tenant-application": "Tenant Application",
  "general-contact": "Contact",
  blog: "Blog",
};

type LeadStatus = "new" | "contacted" | "closed";
const VALID_STATUSES: readonly LeadStatus[] = ["new", "contacted", "closed"];

function isLeadStatus(value: string | undefined): value is LeadStatus {
  return !!value && (VALID_STATUSES as readonly string[]).includes(value);
}

async function getLeads(status?: string) {
  try {
    await dbConnect();
    const filter = isLeadStatus(status) ? { status } : {};
    return await Lead.find(filter).sort({ createdAt: -1 }).lean();
  } catch {
    return [];
  }
}

async function getCounts() {
  try {
    await dbConnect();
    const [total, newCount] = await Promise.all([
      Lead.countDocuments({}),
      Lead.countDocuments({ status: "new" }),
    ]);
    return { total, newCount };
  } catch {
    return { total: 0, newCount: 0 };
  }
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const [leads, counts] = await Promise.all([getLeads(status), getCounts()]);

  return (
    <div>
      <AdminPageHeader
        title="Leads"
        description={`Every enquiry submitted through the site — ${counts.total} total, ${counts.newCount} new.`}
      />

      <div className="mt-6 flex gap-1 border-b border-slate-200">
        {STATUS_TABS.map((tab) => {
          const active = (status ?? "") === tab.value;
          const href = tab.value ? `/admin/leads?status=${tab.value}` : "/admin/leads";
          return (
            <Link
              key={tab.value}
              href={href}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active
                  ? "border-brand-gold-dark text-brand-navy"
                  : "border-transparent text-slate-500 hover:text-brand-navy"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {leads.length === 0 ? (
        <p className="mt-8 text-slate-500">No leads here yet.</p>
      ) : (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white overflow-hidden">
          {/* overflow-x-auto on this inner wrapper (not the outer div,
              which needs overflow-hidden to clip the header row's bg
              color to the card's rounded corners) is what lets the table
              actually scroll sideways on a narrow screen — min-w-max on
              the table stops columns from squishing to fit instead. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50">
                <th className="py-3 px-4 font-medium">Name</th>
                <th className="py-3 px-4 font-medium">Type</th>
                <th className="py-3 px-4 font-medium">Received</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={String(lead._id)} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-900">{lead.name}</p>
                    <p className="text-slate-500">{lead.email}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{TYPE_LABELS[lead.type] ?? lead.type}</td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(lead.createdAt).toLocaleString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        lead.status === "new"
                          ? "bg-brand-gold/30 text-brand-navy"
                          : lead.status === "contacted"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {lead.status === "new" ? "New" : lead.status === "contacted" ? "Contacted" : "Closed"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/admin/leads/${lead._id}`} className="text-brand-gold-dark hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
