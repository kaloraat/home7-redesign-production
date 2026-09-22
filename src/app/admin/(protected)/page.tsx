import Link from "next/link";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import Lead from "@/models/Lead";
import Agent from "@/models/Agent";
import Content from "@/models/Content";
import PropertyReference from "@/models/PropertyReference";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

async function getCounts() {
  try {
    await dbConnect();
    const [properties, newLeads, agents, publishedPosts, pendingReferences] = await Promise.all([
      Property.countDocuments(),
      Lead.countDocuments({ status: "new" }),
      Agent.countDocuments({ active: true }),
      Content.countDocuments({ status: "published" }),
      PropertyReference.countDocuments({ status: "pending" }),
    ]);
    return { properties, newLeads, agents, publishedPosts, pendingReferences };
  } catch {
    return { properties: 0, newLeads: 0, agents: 0, publishedPosts: 0, pendingReferences: 0 };
  }
}

const TILES = [
  { key: "properties", label: "Listings", href: "/admin/properties" },
  { key: "newLeads", label: "New leads", href: "/admin/leads?status=new" },
  { key: "agents", label: "Active agents", href: "/admin/agents" },
  { key: "publishedPosts", label: "Published posts", href: "/admin/blog" },
  { key: "pendingReferences", label: "Pending reference checks", href: "/admin/tenancy-checks" },
] as const;

export default async function AdminDashboard() {
  const counts = await getCounts();

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="A quick overview of what's happening on the site."
        action={{ label: "+ Add listing", href: "/admin/properties/new" }}
      />

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl">
        {TILES.map((tile) => (
          <Link
            key={tile.key}
            href={tile.href}
            className="rounded-lg border border-slate-200 bg-white p-5 hover:border-brand-gold-dark transition-colors"
          >
            <p className="font-display text-3xl text-brand-navy">{counts[tile.key]}</p>
            <p className="mt-1 text-sm text-slate-500">{tile.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
