import type { Metadata } from "next";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { getAgentBySlug, getAgentTrackRecord, getPropertiesByAgent } from "@/lib/queries";
import { PhoneIcon, MobileIcon, EmailIcon, FacebookIcon, LinkedInIcon } from "@/components/icons";
import { SITE_URL, BLOG_CONTACT_FORM_INTRO, COMPANY, GOOGLE_RATING, GOOGLE_REVIEWS_URL, MESH_NAVY_BASE, MESH_GLOW_BRIGHT_BLUE, MESH_GLOW_LIGHT_BLUE, MESH_GLOW_DEEP_BLUE, ORG_ID, SITE_NAME, TARGET_SUBURBS, suburbSlug } from "@/lib/constants";
import MeshBackground from "@/components/MeshBackground";
import PropertyCard from "@/components/PropertyCard";
import ResponsiveCardGrid from "@/components/ResponsiveCardGrid";
import PhoneLink from "@/components/lp/PhoneLink";
import { isOfficeNumber } from "@/lib/lp/phone";
import ContactForm from "@/components/ContactForm";
import Testimonials from "@/components/Testimonials";
import { agentPersonId, getAgentProfile } from "@/lib/agentProfiles";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);
  if (!agent) return {};

  const profile = getAgentProfile(agent.slug);
  const record = await getAgentTrackRecord(String(agent._id));
  const results =
    record.soldCount + record.leasedCount > 0
      ? ` ${record.soldCount} properties sold and ${record.leasedCount} leased across Liverpool and South West Sydney.`
      : "";
  const description =
    profile.seoDescription ?? `${agent.name}, ${agent.role} at Home7 Real Estate in Liverpool NSW.${results}`;
  // A profile's seoTitle is a complete title (it already names the role and
  // area), so it skips the " | Home7 Real Estate" template to stay under ~60
  // characters. Agents without one keep "{name} | Home7 Real Estate".
  const title = profile.seoTitle ? { absolute: profile.seoTitle } : agent.name;
  const socialTitle = profile.seoTitle ?? agent.name;
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
      title: socialTitle,
      description,
      images: agent.photo ? [{ url: agent.photo }] : undefined,
    },
    twitter: {
      card: agent.photo ? "summary_large_image" : "summary",
      title: socialTitle,
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
  const [listings, record] = await Promise.all([
    getPropertiesByAgent(String(agent._id)),
    getAgentTrackRecord(String(agent._id)),
  ]);
  const firstName = agent.name.split(" ")[0];
  const topSuburbs = record.suburbs.slice(0, 12);
  const bioParagraphs = (agent.bio || "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const profile = getAgentProfile(agent.slug);
  const pageUrl = `${SITE_URL}/agent/${agent.slug}`;

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
  // ProfilePage wrapping the Person: Google's documented type for a page
  // that's about one person. The Person's @id is stable so the homepage's
  // RealEstateAgent can point at it as `founder`, joining the agency and
  // its principal into one connected entity (what AI answers lean on when
  // they name "who runs Home7").
  const personJsonLd = {
    "@type": "Person",
    "@id": agentPersonId(agent.slug),
    name: agent.name,
    alternateName: profile.alternateName,
    description: bioParagraphs[0] || undefined,
    jobTitle: agent.role,
    image: agent.photo || undefined,
    telephone: agent.phone || agent.mobile || undefined,
    email: agent.email || undefined,
    worksFor: { "@type": "RealEstateAgent", "@id": ORG_ID, name: SITE_NAME },
    url: pageUrl,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    hasCredential: agent.licence
      ? {
          "@type": "EducationalOccupationalCredential",
          credentialCategory: "license",
          name: "NSW real estate licence",
          identifier: agent.licence,
          recognizedBy: { "@type": "GovernmentOrganization", name: "NSW Fair Trading" },
        }
      : undefined,
    knowsAbout: [
      ...(profile.services ?? []).map((s) => s.title),
      ...topSuburbs.map((s) => `${s.name} NSW real estate`),
    ],
  };
  const profilePageJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": pageUrl,
    url: pageUrl,
    name: profile.seoTitle ?? agent.name,
    mainEntity: personJsonLd,
  };
  const faqJsonLd = profile.faqs?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: profile.faqs.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      }
    : null;
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageJsonLd) }}
      />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
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
                alt={`${agent.name}, ${agent.role} at Home7 Real Estate Liverpool`}
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
            {profile.tagline && <p className="mt-1 text-slate-300">{profile.tagline}</p>}
            {agent.licence && (
              <p className="mt-1 text-sm text-slate-300">NSW licence no. {agent.licence}</p>
            )}

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
                {isOfficeNumber(agent.phone) ? (
                  <PhoneLink location="agent-page" className="hover:text-brand-gold-dark" />
                ) : (
                  <a href={`tel:${agent.phone}`} className="hover:text-brand-gold-dark">
                    {agent.phone}
                  </a>
                )}
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

          {bioParagraphs.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-xl text-brand-navy pb-2 border-b-2 border-brand-gold inline-block">
                About {firstName}
              </h2>
              <div className="mt-4 space-y-4">
                {bioParagraphs.map((p, i) => (
                  <p key={i} className="text-lg text-slate-600 leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Real results from this agent's own listings in the DB, so the
              numbers can never drift from what the site actually shows. */}
          {(record.soldCount + record.leasedCount > 0 || profile.yearsExperience) && (
            <div className="mt-8">
              <h2 className="font-display text-xl text-brand-navy pb-2 border-b-2 border-brand-gold inline-block">
                Track Record
              </h2>
              <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {profile.yearsExperience && (
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <dt className="text-sm text-slate-500">Years in Sydney real estate</dt>
                    <dd className="font-display text-3xl text-brand-navy">{profile.yearsExperience}+</dd>
                  </div>
                )}
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <dt className="text-sm text-slate-500">Properties sold</dt>
                  <dd className="font-display text-3xl text-brand-navy">{record.soldCount}</dd>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <dt className="text-sm text-slate-500">Properties leased</dt>
                  <dd className="font-display text-3xl text-brand-navy">{record.leasedCount}</dd>
                </div>
                {profile.showReviews && (
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <dt className="text-sm text-slate-500">Google rating</dt>
                    <dd className="font-display text-3xl text-brand-navy">{GOOGLE_RATING.value}</dd>
                    <a
                      href={GOOGLE_REVIEWS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-brand-gold-dark hover:underline"
                    >
                      {GOOGLE_RATING.count} reviews
                    </a>
                  </div>
                )}
              </dl>
              {topSuburbs.length > 0 && (
                <>
                  <h3 className="mt-6 font-semibold text-brand-navy">Suburbs {firstName} has worked in</h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {topSuburbs.map((s) => {
                      const hasPage = (TARGET_SUBURBS as readonly string[]).includes(s.name);
                      const chip = "rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700";
                      return (
                        <li key={s.name}>
                          {hasPage ? (
                            <Link href={`/suburb/${suburbSlug(s.name)}`} className={`${chip} inline-block hover:border-brand-gold hover:text-brand-gold-dark`}>
                              {s.name}
                            </Link>
                          ) : (
                            <span className={`${chip} inline-block`}>{s.name}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          )}

          {profile.services?.length ? (
            <div className="mt-8">
              <h2 className="font-display text-xl text-brand-navy pb-2 border-b-2 border-brand-gold inline-block">
                How {firstName} Can Help
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {profile.services.map((s) => (
                  <div key={s.title} className="flex flex-col rounded-lg border border-slate-200 bg-white p-4">
                    <h3 className="font-semibold text-brand-navy">{s.title}</h3>
                    <p className="mt-2 flex-1 text-slate-600 leading-relaxed">{s.text}</p>
                    <Link href={s.href} className="mt-3 font-semibold text-brand-navy hover:text-brand-gold-dark">
                      {s.cta}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
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

      {record.recent.length > 0 && (
        <div className="mx-auto max-w-6xl 2xl:max-w-384 px-4 pb-10">
          <div className="flex items-baseline justify-between border-b border-slate-200 pb-4">
            <h2 className="font-display text-2xl sm:text-3xl text-brand-navy">
              Recently Sold &amp; Leased by {firstName}
            </h2>
            <Link href="/sold-properties" className="text-brand-navy font-semibold hover:text-brand-gold-dark">
              All sold
            </Link>
          </div>
          <div className="mt-8">
            <ResponsiveCardGrid
              items={record.recent}
              renderItem={(p) => <PropertyCard key={String(p._id)} property={p} />}
              wide4up
            />
          </div>
        </div>
      )}

      {profile.showReviews && (
        <Testimonials eyebrow="Google reviews" heading={`What Clients Say About ${firstName}`} />
      )}

      {profile.faqs?.length ? (
        <section className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-center font-display text-3xl text-brand-navy">
            Questions About Working With {firstName}
          </h2>
          <div className="mt-8 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {profile.faqs.map(({ q, a }) => (
              <details key={q} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-brand-navy text-lg">
                  {q}
                  <span aria-hidden="true" className="text-brand-gold-dark transition-transform group-open:rotate-45 text-2xl leading-none">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-lg text-slate-600 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-center text-lg text-slate-600">
            Choosing between agents? Read our{" "}
            <Link href="/blog/real-estate-agent-liverpool" className="font-semibold text-brand-navy underline underline-offset-4 hover:text-brand-gold-dark">
              guide to real estate agents in Liverpool
            </Link>
            .
          </p>
        </section>
      ) : null}
    </div>
  );
}
