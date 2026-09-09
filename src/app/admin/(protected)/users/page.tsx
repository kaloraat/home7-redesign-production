import { auth } from "@/auth";
import Link from "next/link";
import dbConnect from "@/lib/db";
import Admin from "@/models/Admin";
import { deleteAdminUser } from "@/actions/admin.actions";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import DeleteButton from "@/components/admin/DeleteButton";

async function getAll() {
  try {
    await dbConnect();
    return await Admin.find({}).select("name email role").sort({ name: 1 }).lean();
  } catch {
    return [];
  }
}

export default async function AdminUsersPage() {
  const [session, admins] = await Promise.all([auth(), getAll()]);
  const isOwner = session?.user.role === "owner";

  return (
    <div>
      <AdminPageHeader
        title="Admin Users"
        description={isOwner ? "Who can sign in to this dashboard." : "Only an owner can manage admin accounts."}
        action={isOwner ? { label: "+ New Admin", href: "/admin/users/new" } : undefined}
      />

      <div className="mt-6 rounded-lg border border-slate-200 bg-white overflow-hidden">
        {/* overflow-x-auto on this inner wrapper (not the outer div,
            which needs overflow-hidden to clip the header row's bg color
            to the card's rounded corners) is what lets the table
            actually scroll sideways on a narrow screen — min-w-max on
            the table stops columns from squishing to fit instead. */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50">
              <th className="py-3 px-4 font-medium">Name</th>
              <th className="py-3 px-4 font-medium">Email</th>
              <th className="py-3 px-4 font-medium">Role</th>
              {isOwner && <th className="py-3 px-4"></th>}
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={String(a._id)} className="border-b border-slate-100 last:border-0">
                <td className="py-3 px-4 font-medium text-slate-900">
                  {a.name}
                  {session?.user.email === a.email && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                </td>
                <td className="py-3 px-4 text-slate-600">{a.email}</td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      a.role === "owner" ? "bg-brand-gold/30 text-brand-navy" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {a.role}
                  </span>
                </td>
                {isOwner && (
                  <td className="py-3 px-4 text-right space-x-3 whitespace-nowrap">
                    <Link href={`/admin/users/${a._id}/reset-password`} className="text-brand-gold-dark hover:underline">
                      Reset Password
                    </Link>
                    {session?.user.email !== a.email && (
                      <DeleteButton onConfirm={deleteAdminUser.bind(null, String(a._id))} itemLabel="this admin account" />
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
