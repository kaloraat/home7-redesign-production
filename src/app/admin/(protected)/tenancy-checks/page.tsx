import { Suspense } from "react";
import Link from "next/link";
import dbConnect from "@/lib/db";
import PropertyReference from "@/models/PropertyReference";
import { deleteReferenceRequest } from "@/actions/tenancyReference.actions";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CreatedToast from "@/components/admin/CreatedToast";
import DeleteButton from "@/components/admin/DeleteButton";

async function getAll() {
  try {
    await dbConnect();
    return await PropertyReference.find({}).sort({ createdAt: -1 }).lean();
  } catch {
    return [];
  }
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  declined: "bg-slate-100 text-slate-500",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  completed: "Completed",
  declined: "Declined",
};

export default async function AdminTenancyChecksPage() {
  const references = await getAll();

  return (
    <div>
      <Suspense fallback={null}>
        <CreatedToast message="Reference request sent." />
      </Suspense>
      <AdminPageHeader
        title="Tenancy Reference Checks"
        description="Rental reference requests sent to applicants' previous agents."
        action={{ label: "+ New Request", href: "/admin/tenancy-checks/new" }}
      />

      {references.length === 0 ? (
        <p className="mt-8 text-slate-500">No reference requests yet.</p>
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
                <th className="py-3 px-4 font-medium">Tenant</th>
                <th className="py-3 px-4 font-medium">Previous Agent</th>
                <th className="py-3 px-4 font-medium">Requested</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {references.map((r) => (
                <tr key={String(r._id)} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-900">{r.tenantName}</p>
                    <p className="text-slate-500">{r.tenantAddress}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {r.agentName} <span className="text-slate-400">({r.agencyName})</span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(r.createdAt).toLocaleDateString("en-AU")}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-3 whitespace-nowrap">
                    <Link href={`/admin/tenancy-checks/${r._id}`} className="text-brand-gold-dark hover:underline">
                      View
                    </Link>
                    <DeleteButton
                      onConfirm={deleteReferenceRequest.bind(null, String(r._id))}
                      itemLabel={`the reference check for ${r.tenantName}`}
                    />
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
