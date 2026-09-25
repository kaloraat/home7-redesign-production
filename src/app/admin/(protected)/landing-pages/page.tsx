import { SITE_URL } from "@/lib/constants";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const AREAS = [
  { slug: "", label: "All areas (Liverpool, Campbelltown & Parramatta)" },
  { slug: "/liverpool", label: "Liverpool" },
  { slug: "/campbelltown", label: "Campbelltown" },
  { slug: "/parramatta", label: "Parramatta" },
];

// Which Google Ads campaigns should point at which page.
const GROUPS = [
  {
    title: "Landlords / property management",
    base: "/lp/property-management",
    ads: "PM - Near Me, Rent My Property, Fees (all areas) · PM - [Council] (area pages)",
    extra: [{ path: "/lp/property-management?intent=switch", label: "Switch-agent variant", ads: "PM - Switch Agent" }],
  },
  {
    title: "Sellers",
    base: "/lp/sell",
    ads: "Sell - Agent Near Me, Sell My House, Home Value, Fees & Commission (all areas) · Sell - [Council] (area pages)",
    extra: [],
  },
];

function Row({ path, label, note }: { path: string; label: string; note?: string }) {
  return (
    <li className="flex flex-col gap-1 border-b border-slate-100 px-4 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-brand-navy">{label}</p>
        <p className="break-all text-sm text-slate-500">{SITE_URL}{path}</p>
        {note && <p className="text-xs text-slate-400">Ad: {note}</p>}
      </div>
      <a
        href={path}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-lg border border-brand-navy px-3 py-1.5 text-center text-sm font-semibold text-brand-navy hover:bg-brand-navy hover:text-white"
      >
        Open ↗
      </a>
    </li>
  );
}

export default function AdminLandingPagesPage() {
  return (
    <div>
      <AdminPageHeader
        title="Landing Pages"
        description="Google Ads landing pages. Hidden from search engines and the sitemap — for ad traffic only."
      />

      <div className="mt-6 space-y-8">
        {GROUPS.map((g) => (
          <section key={g.base}>
            <h2 className="font-display text-xl text-brand-navy">{g.title}</h2>
            <p className="mt-1 text-sm text-slate-500">Campaigns: {g.ads}</p>
            <ul className="mt-3 rounded-lg border border-slate-200 bg-white">
              {AREAS.map((a) => (
                <Row key={a.slug} path={`${g.base}${a.slug}`} label={a.label} />
              ))}
              {g.extra.map((e) => (
                <Row key={e.path} path={e.path} label={e.label} note={e.ads} />
              ))}
            </ul>
          </section>
        ))}

        <section>
          <h2 className="font-display text-xl text-brand-navy">Other</h2>
          <ul className="mt-3 rounded-lg border border-slate-200 bg-white">
            <Row path="/lp/thank-you?type=pm&n=Sam" label="Thank-you page (landlord)" />
            <Row path="/lp/thank-you?type=pm&n=Sam&intent=switch" label="Thank-you page (switch lead)" />
            <Row path="/lp/thank-you?type=sell&n=Sam" label="Thank-you page (seller)" />
          </ul>
          <p className="mt-3 text-sm text-slate-500">
            Test attribution by adding <code>?gclid=TEST123</code> to any page, then submit the form. It appears in the lead email&apos;s tracking block.
          </p>
        </section>
      </div>
    </div>
  );
}
