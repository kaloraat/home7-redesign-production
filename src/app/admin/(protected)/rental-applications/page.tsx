import Link from "next/link";
import dbConnect from "@/lib/db";
import TenancyApplication from "@/models/TenancyApplication";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

async function getAll() {
  try {
    await dbConnect();
    return await TenancyApplication.find({}).sort({ createdAt: -1 }).lean();
  } catch {
    return [];
  }
}

const STATUS_STYLES: Record<string, string> = {
  new: "bg-amber-100 text-amber-700",
  reviewed: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  declined: "bg-slate-100 text-slate-500",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  reviewed: "Reviewed",
  approved: "Approved",
  declined: "Declined",
};

export default async function AdminRentalApplicationsPage() {
  const applications = await getAll();

  return (
    <div>
      <AdminPageHeader
        title="Rental Applications"
        description="Online Residential Tenancy Applications submitted via the site."
      />

      {applications.length === 0 ? (
        <p className="mt-8 text-slate-500">No applications yet.</p>
      ) : (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50">
                  <th className="py-3 px-4 font-medium">Applicant</th>
                  <th className="py-3 px-4 font-medium">Property</th>
                  <th className="py-3 px-4 font-medium">Submitted</th>
                  <th className="py-3 px-4 font-medium">Actions</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={String(a._id)} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900">
                        {a.firstName} {a.lastName}
                      </p>
                      <p className="text-slate-500">{a.email}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{a.propertyAddress}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(a.createdAt).toLocaleDateString("en-AU")}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Link href={`/admin/rental-applications/${a._id}`} className="text-brand-gold-dark hover:underline">
                        View
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[a.status]}`}>
                        {STATUS_LABELS[a.status]}
                      </span>
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
