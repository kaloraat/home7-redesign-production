import Link from "next/link";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import Lead from "@/models/Lead";
import Agent from "@/models/Agent";
import Content from "@/models/Content";
import PropertyReference from "@/models/PropertyReference";
import { BRAND_GRADIENT } from "@/lib/constants";

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
      {/* Gradient hero banner — reuses the site's existing BRAND_GRADIENT
          (same navy-to-teal used on SiteNav / the agent-profile hero) so
          admin picks up the brand's own signature look rather than a new
          one-off style. A soft blurred glow behind the heading and a
          pill-shaped gradient CTA are the two design-update ideas from the
          REB Dealmakers reference, prototyped here first since this is the
          lowest-risk, most-visible screen in admin. */}
      <section
        className="relative overflow-hidden rounded-2xl p-8 text-white"
        style={{ background: BRAND_GRADIENT }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-teal/40 blur-3xl"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl">Dashboard</h1>
            <p className="mt-1 text-white/70">A quick overview of what&apos;s happening on the site.</p>
          </div>
          <Link
            href="/admin/properties/new"
            className="inline-flex w-fit items-center gap-1.5 rounded-full px-5 py-2.5 font-display text-sm font-semibold text-brand-navy shadow-lg transition-transform hover:scale-[1.03]"
            style={{ background: "linear-gradient(135deg, #7fe0ef 0%, #ffffff 100%)" }}
          >
            + Add listing
          </Link>
        </div>
      </section>

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
