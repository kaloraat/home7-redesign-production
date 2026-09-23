import type { Metadata } from "next";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { getAgentBySlug, getPropertiesByAgent } from "@/lib/queries";
import { PhoneIcon, MobileIcon, EmailIcon, FacebookIcon, LinkedInIcon } from "@/components/icons";
import {
  SITE_URL,
  BLOG_CONTACT_FORM_INTRO,
  COMPANY,
  MESH_NAVY_BASE,
  MESH_GLOW_BRIGHT_BLUE,
  MESH_GLOW_LIGHT_BLUE,
  MESH_GLOW_DEEP_BLUE,
} from "@/lib/constants";
import MeshBackground from "@/components/MeshBackground";
import PropertyCard from "@/components/PropertyCard";
import ResponsiveCardGrid from "@/components/ResponsiveCardGrid";
import ContactForm from "@/components/ContactForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);
  if (!agent) return {};

  const title = agent.name;
  const description = `${agent.name} — ${agent.role} at Home7 Real Estate, Liverpool NSW.`;
  const url = `${SITE_URL}/agent/${agent.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    // See property/[slug]/page.tsx's generateMetadata for why this can't
    // just be title/image — a page-level `openGraph` replaces the root
    // layout's entirely rather than merging into it.
    openGraph: {
      type: "profile",
      url,
      title,
      description,
      images: agent.photo ? [{ url: agent.photo }] : undefined,
    },
    twitter: {
      card: agent.photo ? "summary_large_image" : "summary",
      title,
      description,
      images: agent.photo ? [agent.photo] : undefined,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);
  if (!agent) notFound();

  // getAgentBySlug() falls back to a case-insensitive match — if a
  // mixed-case URL is what actually matched, canonicalize rather than
  // rendering the same profile live at two URLs.
  if (agent.slug !== slug) {
    permanentRedirect(`/agent/${agent.slug}`);
  }

  // Internal linking — this page had zero links into any property page
  // before, despite being the natural "who's selling this" companion to
  // the "Listed by {agent}" link property pages now carry back here.
  const listings = await getPropertiesByAgent(String(agent._id));

  // Mohammed-specific per explicit request — everyone else keeps the
  // shared BLOG_CONTACT_FORM_INTRO copy ("a local property expert"),
  // which stays accurate for any agent without special-casing this per
  // person. Matched by slug (this exact profile), not by first name.
  const contactFormIntro =
    agent.slug === "mohammed-r-islam"
      ? BLOG_CONTACT_FORM_INTRO.replace("a local property expert", "Mohammed")
      : BLOG_CONTACT_FORM_INTRO;

  // Neither of these existed on this page before — Person is the correct
  // schema.org type for a staff profile (distinct from RealEstateAgent,
  // which the homepage already uses for the business itself), and every
  // other page template has a BreadcrumbList except this one and
  // property/[slug] (now fixed there too).
  // sameAs — the page already renders these as Facebook/LinkedIn icon
  // links (below) but never fed them into the schema, which is exactly
  // what sameAs is for: telling Google "this Person's profile on other
  // sites is the same entity as this one", a real disambiguation/identity
  // signal, not just decoration. Falls back to Home7's own official pages
  // when an agent has no page of their own set — confirmed against the
  // original Laravel export that every team member's social icon actually
  // pointed at one of these same two company URLs anyway (nobody had a
  // genuinely personal profile linked), so this isn't inventing a
  // fallback, it's matching what was already true.
  const facebookUrl = agent.facebook || COMPANY.facebook;
  const linkedinUrl = agent.linkedin || COMPANY.linkedin;
  const sameAs = [facebookUrl, linkedinUrl].filter((url): url is string => Boolean(url));
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: agent.name,
    jobTitle: agent.role,
    image: agent.photo || undefined,
    telephone: agent.phone || agent.mobile || undefined,
    email: agent.email || undefined,
    worksFor: { "@type": "RealEstateAgent", name: "Home7 Real Estate" },
    url: `${SITE_URL}/agent/${agent.slug}`,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Our Team", item: `${SITE_URL}/agents` },
      { "@type": "ListItem", position: 3, name: agent.name, item: `${SITE_URL}/agent/${agent.slug}` },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Same blurred-blue-patches style as the homepage's "Real Estate is
          in our blood" section, per the client's request — not the plain
          SiteNav gradient anymore. */}
      <section
        className="relative overflow-hidden text-white"
        style={{ backgroundColor: MESH_NAVY_BASE }}
      >
        <MeshBackground
          blobs={[
            { className: "-left-16 -top-20 h-72 w-80 opacity-80 blur-3xl", color: MESH_GLOW_BRIGHT_BLUE },
            { className: "-top-10 left-1/3 h-56 w-56 opacity-50 blur-3xl", color: MESH_GLOW_LIGHT_BLUE },
            { className: "-bottom-24 right-0 h-64 w-72 opacity-70 blur-3xl", color: MESH_GLOW_DEEP_BLUE },
            { className: "-right-10 top-0 h-40 w-40 opacity-40 blur-3xl", color: MESH_GLOW_LIGHT_BLUE },
          ]}
        />
        {/* max-w-7xl — matches the content section below (and blog/
            property pages) exactly, so the photo+name block's left edge
            lines up with the page's actual content column instead of
            sitting further right (was max-w-4xl, a narrower container
            centered independently of the 7xl one below it, so their left
            edges never lined up even though both individually looked
            "centered"). */}
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:py-16 flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
          {agent.photo && (
            <div className="h-32 w-32 sm:h-40 sm:w-40 shrink-0 rounded-full overflow-hidden ring-4 ring-brand-gold shadow-lg">
              <Image
                src={agent.photo}
                alt={agent.name}
                width={160}
                height={160}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div>
            <p className="text-brand-gold text-xs uppercase tracking-widest font-semibold">
              Home7 Real Estate
            </p>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl">{agent.name}</h1>
            <p className="mt-1 text-slate-200">{agent.role}</p>

            {/* Falls back to Home7's own Facebook/LinkedIn (facebookUrl/
                linkedinUrl above) when this agent has no page of their
                own — always renders now rather than only for the few
                agents with a personal link set, since a real destination
                exists either way. */}
            <div className="mt-4 flex items-center justify-center sm:justify-start gap-3">
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Home7 Real Estate on Facebook"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 hover:border-brand-gold hover:text-brand-gold transition-colors"
              >
                <FacebookIcon />
              </a>
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Home7 Real Estate on LinkedIn"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 hover:border-brand-gold hover:text-brand-gold transition-colors"
              >
                <LinkedInIcon />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Same container width and sidebar column as the blog post page
          (blog/[slug]/page.tsx) — max-w-7xl (matching the property page
          too) with a 508px sidebar, kept in sync with that page's own
          width rather than a fixed value here, so a change to one keeps
          matching the other rather than drifting apart again. Was a
          fractional lg:grid-cols-3 (~341px on this page's narrower
          max-w-6xl) before an earlier pass matched it to blog's then-380px;
          this keeps that same consistency now that blog's own sidebar
          has grown. */}
      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-8 lg:grid-cols-[1fr_508px] items-start">
        <div>
          {/* Labeled rows (Office/Mobile/WhatsApp/Email), matching the live
              site's own agent page layout — was an unlabeled icon-only row
              before, which lost the office-vs-mobile-vs-WhatsApp distinction
              (three different numbers, three different reasons to use one
              over another) and never showed WhatsApp at all. */}
          <div className="space-y-2 text-lg text-slate-700">
            {agent.phone && (
              <p className="flex items-center gap-2">
                <PhoneIcon size={14} className="shrink-0 text-brand-navy" />
                <span className="font-semibold text-brand-navy">Office:</span>
                <a href={`tel:${agent.phone}`} className="hover:text-brand-gold-dark">
                  {agent.phone}
                </a>
              </p>
            )}
            {agent.mobile && (
              <p className="flex items-center gap-2">
                <MobileIcon size={14} className="shrink-0 text-brand-navy" />
                <span className="font-semibold text-brand-navy">Mobile:</span>
                <a href={`tel:${agent.mobile}`} className="hover:text-brand-gold-dark">
                  {agent.mobile}
                </a>
              </p>
            )}
            {agent.whatsapp && (
              <p className="flex items-center gap-2">
                <MobileIcon size={14} className="shrink-0 text-brand-navy" />
                <span className="font-semibold text-brand-navy">WhatsApp:</span>
                <a
                  href={`https://wa.me/${agent.whatsapp.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-gold-dark"
                >
                  {agent.whatsapp}
                </a>
              </p>
            )}
            {agent.email && (
              <p className="flex items-center gap-2">
                <EmailIcon size={14} className="shrink-0 text-brand-navy" />
                <span className="font-semibold text-brand-navy">Email:</span>
                <a href={`mailto:${agent.email}`} className="hover:text-brand-gold-dark">
                  {agent.email}
                </a>
              </p>
            )}
          </div>

          {agent.bio && (
            <div className="mt-8">
              <h2 className="font-display text-xl text-brand-navy pb-2 border-b-2 border-brand-gold inline-block">
                Description
              </h2>
              <p className="mt-4 text-lg text-slate-600 leading-relaxed">{agent.bio}</p>
            </div>
          )}
        </div>

        {/* Not sticky, deliberately — the form and bio are short enough to
            fit on screen together above the listings section below, so
            there's nothing for sticky positioning to actually help with
            here (unlike the property page, where a long description and
            amenities list can scroll well past the sidebar). This page had
            a "Contact {FirstName}" button linking out to the generic
            /contact page before; now the same ContactForm the blog sidebar
            uses (same intro copy, just the heading swapped to this
            agent's name), so a visitor sees the identical form wherever
            one appears on the site rather than two different-looking
            ones. */}
        <aside>
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <ContactForm
              leadType="general-contact"
              heading={`Contact ${agent.name.split(" ")[0]}`}
              intro={contactFormIntro}
              fallbackMessage={`Enquiry for ${agent.name}`}
            />
          </div>
        </aside>
      </div>

      {/* Own container, matching the homepage's ListingsSection width
          exactly (max-w-6xl, 2xl:max-w-384) rather than sitting inside the
          two-column bio/contact-form grid above — 2/3 of that grid's width
          (once the sidebar takes its third) would squeeze these cards
          narrower than they render everywhere else on the site. */}
      {listings.length > 0 && (
        <div className="mx-auto max-w-6xl 2xl:max-w-384 px-4 pb-10">
          {/* Same header treatment as the homepage's listing sections
              (ListingsSection.tsx) — border-bottom under the heading, not
              a border-top rule above it — so this reads as the same kind
              of section wherever it appears on the site. */}
          <div className="flex items-baseline justify-between border-b border-slate-200 pb-4">
            <h2 className="font-display text-2xl sm:text-3xl text-brand-navy">
              Current Listings from {agent.name.split(" ")[0]}
            </h2>
          </div>
          <div className="mt-8">
            <ResponsiveCardGrid
              items={listings}
              renderItem={(p) => <PropertyCard key={String(p._id)} property={p} />}
              wide4up
            />
          </div>
        </div>
      )}
    </div>
  );
}
