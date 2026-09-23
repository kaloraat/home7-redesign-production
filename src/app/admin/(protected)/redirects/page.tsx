import Link from "next/link";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Redirect from "@/models/Redirect";
import { deleteRedirect } from "@/actions/redirect.actions";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import DeleteButton from "@/components/admin/DeleteButton";

async function getAll() {
  try {
    await dbConnect();
    return await Redirect.find({}).sort({ createdAt: -1 }).lean();
  } catch {
    return [];
  }
}

export default async function AdminRedirectsPage() {
  const [session, redirects] = await Promise.all([auth(), getAll()]);
  // Deleting is owner-only — see lib/authz.ts.
  const isOwner = session?.user.role === "owner";

  return (
    <div>
      <AdminPageHeader
        title="Redirects"
        description="URL redirects served on every public page — for renamed/removed pages so old links never break."
        action={{ label: "+ New Redirect", href: "/admin/redirects/new" }}
      />

      {redirects.length === 0 ? (
        <p className="mt-8 text-slate-500">No redirects yet.</p>
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
                <th className="py-3 px-4 font-medium">From</th>
                <th className="py-3 px-4 font-medium">To</th>
                <th className="py-3 px-4 font-medium">Code</th>
                <th className="py-3 px-4 font-medium">Actions</th>
                <th className="py-3 px-4 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {redirects.map((r) => (
                <tr key={String(r._id)} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 px-4 font-mono text-xs text-slate-900">{r.fromPath}</td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-600">{r.toPath}</td>
                  <td className="py-3 px-4 text-slate-500">{r.statusCode}</td>
                  <td className="py-3 px-4 space-x-3 whitespace-nowrap">
                    <Link href={`/admin/redirects/${r._id}/edit`} className="text-brand-gold-dark hover:underline">
                      Edit
                    </Link>
                    {isOwner && (
                      <DeleteButton onConfirm={deleteRedirect.bind(null, String(r._id))} itemLabel="this redirect" />
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{r.note || "—"}</td>
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
