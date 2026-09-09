import Image from "next/image";
import Link from "next/link";
import dbConnect from "@/lib/db";
import Agent from "@/models/Agent";
import { deleteAgent } from "@/actions/agent.actions";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import DeleteButton from "@/components/admin/DeleteButton";

async function getAll() {
  try {
    await dbConnect();
    return await Agent.find({}).sort({ order: 1, name: 1 }).lean();
  } catch {
    return [];
  }
}

export default async function AdminAgentsPage() {
  const agents = await getAll();

  return (
    <div>
      <AdminPageHeader
        title="Agents"
        description="Team profiles shown on /agents and assignable to property listings."
        action={{ label: "+ New Agent", href: "/admin/agents/new" }}
      />

      {agents.length === 0 ? (
        <p className="mt-8 text-slate-500">No agents yet.</p>
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
                <th className="py-3 px-4 font-medium">Agent</th>
                <th className="py-3 px-4 font-medium">Role</th>
                <th className="py-3 px-4 font-medium">Order</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={String(a._id)} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full overflow-hidden bg-slate-100 shrink-0">
                        {a.photo && (
                          <Image src={a.photo} alt={a.name} width={36} height={36} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <span className="font-medium text-slate-900">{a.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{a.role}</td>
                  <td className="py-3 px-4 text-slate-600">{a.order}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        a.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {a.active ? "Live" : "Hidden"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-3 whitespace-nowrap">
                    <Link href={`/admin/agents/${a._id}/edit`} className="text-brand-gold-dark hover:underline">
                      Edit
                    </Link>
                    <DeleteButton onConfirm={deleteAgent.bind(null, String(a._id))} itemLabel="this agent" />
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
