"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { COMPANY } from "@/lib/constants";
import { DECLARATION, LEASE_TERMS } from "@/lib/rentalApplication/constants";
import { emptyApplication, type ApplicationData, type SectionId } from "@/lib/rentalApplication/types";
import { isOptional, validateAll, validateSection, type Errors } from "@/lib/rentalApplication/validate";
import { sectionSummary } from "@/lib/rentalApplication/summary";
import { applicationFiles } from "@/lib/rentalApplication/files";
import { SECTION_COMPONENTS, type Update } from "./sections";
import { Checkbox, Field, FieldError, InfoBox, RadioList, Segmented, TextInput, aria, cardCls, inputCls, primaryBtn, textBtn, uploadsInFlight } from "./ui";

export type Listing = {
  slug: string;
  street: string;
  fullAddress: string;
  image: string | null;
  rentPerWeek: number | null;
  available: string | null;
  beds: number | null;
  baths: number | null;
  cars: number | null;
};

const SECTIONS: Record<SectionId, { title: string; subtitle?: string }> = {
  personal: { title: "Personal details" },
  about: { title: "About me", subtitle: "A short introduction to the owner" },
  addresses: { title: "Address history" },
  employment: { title: "Employment" },
  finances: { title: "Finances" },
  ids: { title: "Identity documents" },
  emergency: { title: "Emergency contact" },
  people: { title: "People", subtitle: "Who will be living at the property" },
  second: { title: "Second applicant", subtitle: "Their own details, employment, income and ID" },
  pets: { title: "Pets", subtitle: "Any pets that will live with you" },
};
const PERSONAL_GROUP: SectionId[] = ["personal", "about", "addresses", "employment", "finances", "ids", "emergency"];
const isSection = (s: string | null): s is SectionId => !!s && s in SECTIONS;

/* ---------- saved progress (text only) ---------- */

const STORE_PREFIX = "h7_rental_app:";
const TTL = 7 * 24 * 60 * 60 * 1000;
type Stored = { savedAt: number; startedAt: number; data: ApplicationData };

/** Copy without any uploaded files or ID details: those never touch localStorage. */
function stripForStorage(app: ApplicationData): ApplicationData {
  const c = structuredClone(app);
  c.about.docs = [];
  for (const p of [c.applicant, c.second]) {
    if (!p) continue;
    p.finances.proof = [];
    p.ids = { photo: null, second: null };
  }
  return c;
}

function loadStored(key: string): Stored | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const s = JSON.parse(raw) as Stored;
    if (!s?.data || Date.now() - s.savedAt > TTL) {
      localStorage.removeItem(key);
      return null;
    }
    // Merge onto a fresh object so older saved shapes still load.
    const base = emptyApplication();
    return { ...s, data: { ...base, ...s.data, lease: { ...base.lease, ...s.data.lease } } };
  } catch {
    return null;
  }
}

const subscribe = () => () => {};

/** Renders on the client only (saved progress lives in localStorage). */
export default function RentalApplication(props: { listing: Listing | null }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  if (!mounted) {
    return <div className="mx-auto max-w-[900px] px-4 py-16 text-center text-slate-500">Loading your application…</div>;
  }
  return <ApplicationApp {...props} />;
}

function ApplicationApp({ listing }: { listing: Listing | null }) {
  const storeKey = `${STORE_PREFIX}${listing?.slug ?? "general"}`;
  const [initial] = useState(() => loadStored(storeKey));
  const [app, setApp] = useState<ApplicationData>(() => initial?.data ?? emptyApplication());
  const [startedAt] = useState(() => initial?.startedAt ?? Date.now());
  const [session] = useState(() => crypto.randomUUID());
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [serverError, setServerError] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const pushedRef = useRef(false);
  const lastSectionRef = useRef<SectionId | null>(null);

  const params = useSearchParams();
  const stepParam = params.get("step");
  const step = isSection(stepParam) && (stepParam !== "second" || app.second) ? stepParam : null;

  // Save text answers as they go.
  useEffect(() => {
    if (status === "done") return;
    try {
      localStorage.setItem(storeKey, JSON.stringify({ savedAt: Date.now(), startedAt, data: stripForStorage(app) } satisfies Stored));
    } catch {}
  }, [app, storeKey, startedAt, status]);

  // Files only live in this tab until submit: warn before a refresh loses them.
  const hasFiles = applicationFiles(app).length > 0;
  useEffect(() => {
    if (!hasFiles || status === "done") return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasFiles, status]);

  const goTo = useCallback((id: SectionId | null) => {
    const url = new URL(window.location.href);
    if (id) {
      lastSectionRef.current = id;
      url.searchParams.set("step", id);
      window.history.pushState(null, "", url);
      pushedRef.current = true;
    } else if (pushedRef.current) {
      pushedRef.current = false;
      window.history.back();
    } else {
      url.searchParams.delete("step");
      window.history.replaceState(null, "", url);
    }
  }, []);

  // Scroll to the top of each screen; back on the hub, return to the row.
  useEffect(() => {
    if (step) {
      window.scrollTo(0, 0);
      document.getElementById("ra-section-title")?.focus();
    } else if (lastSectionRef.current) {
      const row = document.getElementById(`row-${lastSectionRef.current}`);
      row?.scrollIntoView({ block: "center" });
      row?.focus({ preventScroll: true });
    }
  }, [step]);

  const shortAddress = listing?.street || app.propertyAddress.split(",")[0] || "Rental property";
  const fullAddress = listing?.fullAddress || app.propertyAddress;

  if (status === "done") return <Confirmation address={fullAddress} />;

  if (step) {
    return (
      <SectionScreen
        key={step}
        id={step}
        app={app}
        session={session}
        shortAddress={shortAddress}
        onCancel={() => goTo(null)}
        onSave={(draft) => {
          setApp({ ...draft, saved: { ...draft.saved, [step]: true } });
          goTo(null);
        }}
      />
    );
  }

  return (
    <Hub
      app={app}
      setApp={setApp}
      listing={listing}
      attempted={attempted}
      status={status}
      serverError={serverError}
      honeypot={honeypot}
      setHoneypot={setHoneypot}
      onOpen={goTo}
      onClear={() => {
        if (!window.confirm("Clear everything you've entered on this application?")) return;
        try { localStorage.removeItem(storeKey); } catch {}
        setApp(emptyApplication());
        setAttempted(false);
        window.scrollTo(0, 0);
      }}
      onSubmit={async () => {
        setAttempted(true);
        setServerError("");
        const v = validateAll(app, !!listing);
        const first = Object.keys(v.lease).length ? "ra-lease" : Object.keys(v.sections)[0] ? `row-${Object.keys(v.sections)[0]}` : Object.keys(v.declaration).length ? "ra-declaration" : null;
        if (first) {
          document.getElementById("ra-missing")?.scrollIntoView({ block: "center" });
          document.getElementById("ra-missing")?.focus({ preventScroll: true });
          return;
        }
        if (uploadsInFlight.count > 0) {
          setServerError("Please wait for your uploads to finish.");
          return;
        }
        setStatus("sending");
        try {
          const res = await fetch("/api/property-tenant-application-download/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ propertySlug: listing?.slug, uploadSession: session, startedAt, website: honeypot, data: app }),
          });
          const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
          if (!res.ok || !body?.ok) throw new Error(body?.error || "Something went wrong. Please try again.");
          try { localStorage.removeItem(storeKey); } catch {}
          setStatus("done");
          window.scrollTo(0, 0);
        } catch (err) {
          setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
          setStatus("idle");
        }
      }}
    />
  );
}

/* ======================= section screen ======================= */

function SectionScreen({
  id, app, session, shortAddress, onCancel, onSave,
}: {
  id: SectionId; app: ApplicationData; session: string; shortAddress: string; onCancel: () => void; onSave: (d: ApplicationData) => void;
}) {
  const [draft, setDraft] = useState(() => structuredClone(app));
  const [showErrors, setShowErrors] = useState(false);
  const [note, setNote] = useState("");
  const update: Update = useCallback((fn) => setDraft((d) => { const c = structuredClone(d); fn(c); return c; }), []);
  const errors: Errors = showErrors ? validateSection(id, draft) : {};
  const Section = SECTION_COMPONENTS[id];

  function save() {
    if (uploadsInFlight.count > 0) {
      setNote("Please wait for your uploads to finish.");
      return;
    }
    setNote("");
    const errs = validateSection(id, draft);
    if (Object.keys(errs).length) {
      setShowErrors(true);
      setNote(`Please fix ${Object.keys(errs).length === 1 ? "the highlighted field" : "the highlighted fields"}.`);
      requestAnimationFrame(() => {
        const bad = document.querySelector<HTMLElement>('main [aria-invalid="true"], main .ring-red-600');
        bad?.scrollIntoView({ block: "center" });
        bad?.focus?.({ preventScroll: true });
      });
      return;
    }
    onSave(draft);
  }

  return (
    <main>
      <div className="bg-slate-100">
        <div className="mx-auto max-w-[900px] px-4 py-6 sm:py-8">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600">Your application - {shortAddress}</p>
          <h1 id="ra-section-title" tabIndex={-1} className="mt-1 font-display text-3xl leading-tight text-brand-navy focus:outline-none sm:text-4xl">
            {SECTIONS[id].title}
          </h1>
        </div>
      </div>
      <div className="mx-auto max-w-[900px] px-4 py-6 sm:py-8">
        <div className="max-w-[525px] space-y-6">
          <Section draft={draft} update={update} errors={errors} session={session} />
          {note && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-base font-medium text-red-800">{note}</p>}
          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-end">
            <button type="button" onClick={onCancel} className={textBtn}>Cancel</button>
            <button type="button" onClick={save} className={`${primaryBtn} w-full sm:w-auto`}>Save and back</button>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ======================= hub ======================= */

function Hub({
  app, setApp, listing, attempted, status, serverError, honeypot, setHoneypot, onOpen, onClear, onSubmit,
}: {
  app: ApplicationData;
  setApp: React.Dispatch<React.SetStateAction<ApplicationData>>;
  listing: Listing | null;
  attempted: boolean;
  status: "idle" | "sending" | "done";
  serverError: string;
  honeypot: string;
  setHoneypot: (v: string) => void;
  onOpen: (id: SectionId) => void;
  onClear: () => void;
  onSubmit: () => void;
}) {
  const v = useMemo(() => validateAll(app, !!listing), [app, listing]);
  const leaseErr = attempted ? v.lease : {};
  const declErr = attempted ? v.declaration : {};
  const set = (fn: (d: ApplicationData) => void) => setApp((d) => { const c = structuredClone(d); fn(c); return c; });
  const today = new Date().toISOString().slice(0, 10);
  const startId = "ra-start";
  const sigId = "ra-sig";
  const coSigId = "ra-cosig";

  const missing: { label: string; target: string; open?: SectionId }[] = [
    ...(Object.keys(v.lease).length ? [{ label: "Lease details", target: "ra-lease" }] : []),
    ...(Object.keys(v.sections) as SectionId[]).map((id) => ({ label: SECTIONS[id].title, target: `row-${id}`, open: id })),
    ...(Object.keys(v.declaration).length ? [{ label: "Declaration and signature", target: "ra-declaration" }] : []),
  ];

  const householdRows: SectionId[] = ["people", ...(app.second ? (["second"] as SectionId[]) : []), "pets"];

  return (
    <main className="pb-12">
      <div className="mx-auto max-w-[900px] px-4 pt-6">
        <InfoBox><strong>Inspect the property before paying any money.</strong></InfoBox>

        <p className="mt-6 text-xs font-bold uppercase tracking-widest text-slate-600">Rental application</p>
        <h1 className="mt-1 font-display text-3xl leading-tight text-brand-navy sm:text-4xl">{listing ? listing.fullAddress : "Apply for a Home7 rental"}</h1>

        <div id="ra-lease" tabIndex={-1} className="mt-6 grid gap-6 focus:outline-none md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:gap-8">
          {listing ? <ListingCard listing={listing} /> : (
            <div className={`${cardCls} self-start p-5`}>
              <TextInput
                label="Address of the property you're applying for"
                value={app.propertyAddress}
                maxLength={300}
                error={leaseErr.propertyAddress}
                onChange={(val) => set((d) => { d.propertyAddress = val; })}
              />
            </div>
          )}

          <div className="space-y-5">
            <RadioList
              label="Have you inspected the property?"
              value={app.lease.inspected}
              error={leaseErr.inspected}
              options={[{ value: "yes", label: "Yes, I have or plan to" }, { value: "no", label: "No, I accept it as is" }]}
              onChange={(val) => set((d) => { d.lease.inspected = val as "yes" | "no"; })}
            />
            <Field id={startId} label="Preferred lease start date" error={leaseErr.startDate}>
              <input {...aria(startId, leaseErr.startDate)} type="date" min={today} value={app.lease.startDate} onChange={(e) => set((d) => { d.lease.startDate = e.target.value; })} className={inputCls} />
            </Field>
            <Segmented
              label="Initial lease term (months)"
              value={app.lease.termMonths}
              options={LEASE_TERMS}
              error={leaseErr.termMonths}
              onChange={(val) => set((d) => { d.lease.termMonths = val; })}
            />
            {listing?.rentPerWeek ? (
              <div>
                <p className="mb-1.5 text-[0.95rem] font-semibold text-slate-800">Rent per week</p>
                <p className="flex min-h-12 items-center rounded-lg bg-slate-100 px-3.5 text-lg font-bold text-brand-navy">${listing.rentPerWeek.toLocaleString("en-AU")}</p>
                <p className="mt-1 text-sm text-slate-500">As advertised for this property.</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <section className="mt-10 bg-slate-100 py-8 sm:py-10" aria-labelledby="ra-your-app">
        <div className="mx-auto max-w-[900px] px-4">
          <h2 id="ra-your-app" className="font-display text-2xl text-brand-navy sm:text-3xl">Your application</h2>
          <RowGroup title="Personal" ids={PERSONAL_GROUP} app={app} attempted={attempted} v={v} onOpen={onOpen} />
          <RowGroup title="Household" ids={householdRows} app={app} attempted={attempted} v={v} onOpen={onOpen} />
          <button type="button" onClick={onClear} className="mt-5 min-h-11 text-sm font-semibold text-slate-600 underline underline-offset-4 hover:text-brand-navy">
            Clear my details
          </button>
        </div>
      </section>

      <div className="mx-auto max-w-[900px] px-4">
        <section id="ra-declaration" tabIndex={-1} className="mt-10 space-y-4 focus:outline-none" aria-labelledby="ra-decl-h">
          <h2 id="ra-decl-h" className="font-display text-2xl text-brand-navy">Declaration</h2>
          <div className="space-y-1">
            <Checkbox checked={app.declaration.c1} error={!!declErr.checks && !app.declaration.c1} onChange={(val) => set((d) => { d.declaration.c1 = val; })}>{DECLARATION.c1}</Checkbox>
            <Checkbox checked={app.declaration.c2} error={!!declErr.checks && !app.declaration.c2} onChange={(val) => set((d) => { d.declaration.c2 = val; })}>
              {DECLARATION.c2Before}
              <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-navy underline underline-offset-2">{DECLARATION.c2Link}</Link>
              {DECLARATION.c2After}
            </Checkbox>
            <Checkbox checked={app.declaration.c3} error={!!declErr.checks && !app.declaration.c3} onChange={(val) => set((d) => { d.declaration.c3 = val; })}>{DECLARATION.c3}</Checkbox>
            <FieldError error={declErr.checks} />
          </div>
          <div className="max-w-[525px] space-y-4">
            <Field id={sigId} label={app.second ? "Applicant 1: type your full name to sign" : "Type your full name to sign"} error={declErr.signature}>
              <input {...aria(sigId, declErr.signature)} autoComplete="name" maxLength={160} value={app.declaration.signature} onChange={(e) => set((d) => { d.declaration.signature = e.target.value; })} className={`${inputCls} font-display text-lg`} />
            </Field>
            {app.second && (
              <Field id={coSigId} label="Applicant 2: type your full name to sign" error={declErr.coSignature}>
                <input {...aria(coSigId, declErr.coSignature)} maxLength={160} value={app.declaration.coSignature} onChange={(e) => set((d) => { d.declaration.coSignature = e.target.value; })} className={`${inputCls} font-display text-lg`} />
              </Field>
            )}
          </div>
        </section>

        {/* Honeypot: hidden from people and unfocusable; bots that fill every field trip it. */}
        <div aria-hidden="true" inert className="pointer-events-none absolute left-[-9999px] h-px w-px overflow-hidden opacity-0">
          <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} /></label>
        </div>

        <div className="mt-10 text-center">
          {attempted && missing.length > 0 && (
            <div id="ra-missing" tabIndex={-1} role="alert" className="mx-auto mb-6 max-w-[525px] rounded-xl bg-red-50 p-4 text-left ring-1 ring-red-200 focus:outline-none">
              <p className="font-semibold text-red-900">Please complete these before submitting:</p>
              <ul className="mt-2 space-y-1">
                {missing.map((m) => (
                  <li key={m.target}>
                    <button
                      type="button"
                      className="min-h-10 text-left text-base font-semibold text-red-800 underline underline-offset-4"
                      onClick={() => {
                        if (m.open) onOpen(m.open);
                        else {
                          const el = document.getElementById(m.target);
                          el?.scrollIntoView({ block: "center" });
                          el?.focus({ preventScroll: true });
                        }
                      }}
                    >
                      {m.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {serverError && <p role="alert" className="mx-auto mb-4 max-w-[525px] rounded-lg bg-red-50 px-4 py-3 text-base font-medium text-red-800">{serverError}</p>}
          <button type="button" onClick={onSubmit} disabled={status === "sending"} className={`${primaryBtn} w-full min-h-14 text-lg`}>
            {status === "sending" ? "Sending…" : "Submit application"}
          </button>
          <p className="mt-3 text-sm text-slate-600">Your application will be sent to Home7 Real Estate</p>
        </div>
      </div>
    </main>
  );
}

function RowGroup({
  title, ids, app, attempted, v, onOpen,
}: {
  title: string; ids: SectionId[]; app: ApplicationData; attempted: boolean; v: ReturnType<typeof validateAll>; onOpen: (id: SectionId) => void;
}) {
  return (
    <div className="mt-6">
      <h3 className="mb-2 text-sm font-bold uppercase tracking-widest text-slate-600">{title}</h3>
      <ul className="space-y-2">
        {ids.map((id) => {
          const saved = !!app.saved[id];
          const hasIssue = !!v.sections[id];
          const complete = saved && !hasIssue;
          const flagged = hasIssue && (attempted || saved);
          const optionalUntouched = !saved && isOptional(id);
          const subtitle = complete ? sectionSummary(id, app) : id === "people" && !saved ? SECTIONS.people.subtitle : SECTIONS[id].subtitle;
          return (
            <li key={id}>
              <button
                id={`row-${id}`}
                type="button"
                onClick={() => onOpen(id)}
                className={`flex min-h-16 w-full items-center gap-3 rounded-xl bg-white px-4 py-3 text-left shadow-[0_1px_4px_rgba(8,19,73,0.06)] ring-1 transition hover:ring-brand-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-navy/40 ${flagged ? "ring-2 ring-red-600" : "ring-slate-200"}`}
              >
                <StatusIcon state={complete ? "done" : flagged ? "error" : "todo"} />
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold text-slate-900">{SECTIONS[id].title}</span>
                  <span className={`block truncate text-sm ${flagged ? "font-medium text-red-700" : "text-slate-600"}`}>
                    {flagged ? "Needs attention" : complete ? subtitle : [subtitle, optionalUntouched ? "Optional" : "Not started"].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" className="shrink-0 text-slate-500"><path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StatusIcon({ state }: { state: "done" | "error" | "todo" }) {
  if (state === "done") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-600 text-white" aria-label="Complete" role="img">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white" aria-label="Needs attention" role="img">!</span>
    );
  }
  return <span className="h-7 w-7 shrink-0 rounded-full border-2 border-slate-300" aria-label="Not complete" role="img" />;
}

function ListingCard({ listing }: { listing: Listing }) {
  const rows = [
    listing.rentPerWeek ? ["Rent", `$${listing.rentPerWeek.toLocaleString("en-AU")} per week`] : null,
    listing.available ? ["Available", new Date(listing.available) <= new Date() ? "Now" : new Date(listing.available).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })] : null,
  ].filter((r): r is string[] => r !== null);
  const facts = [
    listing.beds ? { n: listing.beds, label: "bedrooms", icon: <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 14h18M6 10V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" /> } : null,
    listing.baths ? { n: listing.baths, label: "bathrooms", icon: <path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3ZM6 12V6a2 2 0 0 1 4 0" /> } : null,
    listing.cars ? { n: listing.cars, label: "car spaces", icon: <path d="M5 16V11l2-5h10l2 5v5M3 16h18v2H3zM7 13h.01M17 13h.01" /> } : null,
  ].filter((f): f is NonNullable<typeof f> => f !== null);

  return (
    <div className={`${cardCls} self-start overflow-hidden`}>
      {listing.image && (
        <div className="relative aspect-[4/3] bg-slate-100">
          <Image src={listing.image} alt={`Photo of ${listing.street}`} fill priority sizes="(min-width: 768px) 420px, 100vw" className="object-cover" />
        </div>
      )}
      <div className="p-4">
        {rows.length > 0 && (
          <dl className="divide-y divide-slate-100">
            {rows.map(([k, val]) => (
              <div key={k} className="flex justify-between gap-4 py-2 text-base">
                <dt className="text-slate-600">{k}</dt>
                <dd className="font-semibold text-slate-900">{val}</dd>
              </div>
            ))}
          </dl>
        )}
        {facts.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-4 text-slate-800">
            {facts.map((f) => (
              <li key={f.label} className="flex items-center gap-1.5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{f.icon}</svg>
                <span className="font-semibold">{f.n}</span>
                <span className="sr-only">{f.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Confirmation({ address }: { address: string }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);
  return (
    <main className="mx-auto max-w-[640px] px-4 py-12 sm:py-16">
      <div className={`${cardCls} p-6 sm:p-8`}>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        <h1 ref={headingRef} tabIndex={-1} className="mt-4 font-display text-3xl text-brand-navy focus:outline-none">Application sent</h1>
        <p className="mt-2 text-lg text-slate-700">Thanks. Home7 Real Estate has received your application for <strong className="text-slate-900">{address}</strong>.</p>
        <h2 className="mt-6 font-display text-xl text-brand-navy">What happens next</h2>
        <ol className="mt-3 space-y-3">
          {[
            "Our team reviews your application and may contact your references.",
            "If we need anything else, such as ID, we'll get in touch by phone or email.",
            "We'll let you know the outcome.",
          ].map((s, i) => (
            <li key={s} className="flex gap-3 text-base text-slate-700">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-navy text-sm font-bold text-white" aria-hidden="true">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
        <p className="mt-6 text-base text-slate-700">
          Questions? Call us on <a href={`tel:+61${COMPANY.phone.replace(/\D/g, "").slice(1)}`} className="font-semibold text-brand-navy underline underline-offset-2">{COMPANY.phone}</a>.
        </p>
        <Link href="/properties-for-rent" className={`${primaryBtn} mt-6 w-full sm:w-auto`}>Back to rentals</Link>
      </div>
    </main>
  );
}
