import type { Metadata } from "next";
import Link from "next/link";
import LpHeader from "@/components/lp/LpHeader";
import { LpProvider } from "@/components/lp/LpContext";
import PhoneLink from "@/components/lp/PhoneLink";
import { LpFooter } from "@/components/lp/Sections";
import { THANK_YOU } from "@/lib/lp/content";
import { SITE } from "@/lib/lp/site";

export const metadata: Metadata = {
  title: { absolute: "Thanks, we've got your details | Home7 Real Estate" },
  robots: { index: false, follow: false },
  alternates: { canonical: "/lp/thank-you" },
};

export default async function ThankYou({ searchParams }: { searchParams: Promise<{ type?: string; n?: string }> }) {
  const { type, n } = await searchParams;
  const kind = type === "sell" ? "sell" : "pm";
  const name = (n ?? "").slice(0, 40).trim();

  return (
    <LpProvider leadType={kind} region="all">
      <LpHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 md:py-20">
        {/* The lead conversion is fired by the form on submit, never here, so a refresh can't double-count. */}
        <h1 className="font-display text-3xl leading-tight text-brand-navy md:text-4xl">
          Thanks{name ? ` ${name}` : ""}, we&apos;ve got your details.
        </h1>
        <p className="mt-4 text-lg text-slate-700">
          Someone from our Liverpool office will call you {SITE.callbackPromise}.
        </p>
        <h2 className="mt-10 font-display text-xl text-brand-navy">What happens next</h2>
        <ol className="mt-4 space-y-3">
          {THANK_YOU[kind].map((s, i) => (
            <li key={s} className="flex gap-3 text-lg text-slate-700">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-navy text-sm font-bold text-white" aria-hidden="true">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
        <PhoneLink
          location="thank-you"
          icon
          label="Can't wait? Call"
          className="mt-10 inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-brand-navy px-7 text-lg font-bold text-brand-navy hover:bg-brand-navy hover:text-white"
        />
        <p className="mt-10 text-sm">
          <Link href="/" className="text-slate-600 underline underline-offset-2">Back to home7.com.au</Link>
        </p>
      </main>
      <LpFooter />
    </LpProvider>
  );
}
