import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { COMPANY, SITE_URL } from "@/lib/constants";
import { pageMetadata } from "@/lib/pageMetadata";
import { PhoneIcon, MobileIcon, EmailIcon, PinIcon } from "@/components/icons";
import ContactForm from "@/components/ContactForm";
import ContactMap from "@/components/ContactMap";

const TITLE = "Contact Us";
const DESCRIPTION = "Contact Home7 Real Estate — Liverpool, NSW.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...pageMetadata(TITLE, DESCRIPTION, "/contact"),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Contact Home7", item: `${SITE_URL}/contact` },
  ],
};

// Same order as the live site's sidebar: phone, mobile, secondary mobile,
// email, address. The address line is a step smaller than the rest
// (text-lg vs text-xl) — at the same size it read too large/heavy once it
// wrapped across 3 lines, unlike the short one-line phone/email entries.
const CONTACT_ITEMS = [
  { Icon: PhoneIcon, label: COMPANY.phone, href: `tel:${COMPANY.phone}`, size: "text-xl" },
  { Icon: MobileIcon, label: COMPANY.mobile, href: `tel:${COMPANY.mobile}`, size: "text-xl" },
  { Icon: MobileIcon, label: COMPANY.mobileSecondary, href: `tel:${COMPANY.mobileSecondary}`, size: "text-xl" },
  { Icon: EmailIcon, label: COMPANY.email, href: `mailto:${COMPANY.email}`, size: "text-xl" },
  { Icon: PinIcon, label: COMPANY.address, href: null, size: "text-lg" },
];

export default function Page() {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Same hero technique and height as the About page (see that page's
          hero comment for the full writeup) — real banner photo
          (contact/banner.jpg, sourced from the live site) at 1224x434
          native, stretched to match About's height the same way About's own
          banner is. */}
      <section className="relative overflow-hidden h-72.75 -mt-14.25 min-[430px]:h-68.25 min-[430px]:-mt-7.25 sm:h-75.5 sm:-mt-8.25 lg:h-73.25 lg:mt-0">
        <Image
          src="/images/contact/banner.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/65 to-black/45" />
        <div className="absolute inset-x-0 bottom-0 h-58.5 min-[430px]:h-61 sm:h-67.25 lg:h-73.25 flex flex-col items-center justify-center text-center text-white px-4">
          <p className="text-shadow-hero text-sm text-white/80">
            <Link href="/" className="hover:text-brand-gold">Home</Link> / Contact Home7
          </p>
          <h1 className="text-shadow-hero mt-3 font-display text-5xl sm:text-6xl">Contact Home7</h1>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        {/* Form (2/3) + contact details sidebar (1/3) — matching the live
            site's 8/4 column split. */}
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="font-display text-3xl text-brand-navy mb-6">Contact Home7</h2>
            <ContactForm />
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-6 sm:p-8 h-fit">
            <h3 className="font-display text-2xl text-brand-navy">Contact Details</h3>
            <p className="mt-2 text-lg text-slate-500">
              Please find below contact details and contact us today!
            </p>
            <ul className="mt-6 space-y-4">
              {CONTACT_ITEMS.map(({ Icon, label, href, size }) => (
                <li key={label} className="flex items-start gap-3">
                  <Icon size={18} className="shrink-0 mt-1 text-brand-gold-dark" />
                  {href ? (
                    <a href={href} className={`${size} text-slate-600 hover:text-brand-gold-dark`}>
                      {label}
                    </a>
                  ) : (
                    <span className={`${size} text-slate-600`}>{label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Map — was a free iframe embed (no API key needed); swapped for
            an interactive JS-rendered map now that a Places/Maps key is
            configured. See ContactMap.tsx for the exact same coordinates,
            decoded from that iframe's own pb= parameter, and the reasoning
            on google.maps.Marker vs. AdvancedMarkerElement. */}
        <div className="mt-16">
          <h3 className="font-display text-2xl text-brand-navy mb-4">Our Location</h3>
          <div className="rounded-lg overflow-hidden border border-slate-200">
            <ContactMap />
          </div>
        </div>
      </div>
    </div>
  );
}
