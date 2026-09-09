import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import { pageMetadata } from "@/lib/pageMetadata";
import { normalizeLegacyHtml } from "@/lib/legacyContent";

const TITLE = "Home7 Real Estate Buyers Advisory";
const DESCRIPTION = "Checkout Home7 Real Estate Buyers Advisory";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...pageMetadata(TITLE, DESCRIPTION, "/buyers-advisory"),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Buyers Advisory", item: `${SITE_URL}/buyers-advisory` },
  ],
};

// Verbatim copy migrated from the Laravel site's `pages` table (slug: buyers-advisory).
const CONTENT = "<p>Australia is a country that attracts plenty of interest as a great property investment destination. If you are overseas and looking to purchase property in Australia, here are some steps to consider.</p><p><br></p><p><b>Step 1 \u2013 Assemble Your Professional Associates</b></p><p>Conveyancer: The legal process is very important when purchasing international property, and a conveyancer (or solicitor) can help keep the process moving, ensure that it is compliant and answer any questions you may have. It\u2019s important to remember that when purchasing property in a particular state, the professional must be licensed to operate in that region. It is also worth noting that conveyancers are known as \u201csettlement agents\u201d in Western Australia (WA).Mortgage Provider: When you have a solid mortgage provider on your team, things can move at maximum efficiency. Ensure that you have someone who is experienced in the purchasing of property by non-residents. Their regional location is of no concern, as they can operate nationally. Century 21 can assist with the Mortgage process. By enquiring online here, we can further discuss your options.Accountant: Purchasing international properties does not require an accountant, however, having one present can be a wealth of information when it comes to the financial dealings involved. Their expertise can save you on tax by properly structuring your financial information. If you would like to create an Australian firm or trust to hold and maintain your investment, an accountant must be involved.Buyer\u2019s Agent: Many international investors are unable to travel to Australia for a property viewing, which is why a buyer\u2019s agent is incredibly useful. They can negotiate on your behalf and assist you in finding the perfect property. A buyer\u2019s agent will conduct any necessary dealings with real estate agents and can help you make a solid purchase by giving important information regarding the property\u2019s growth potential.</p><p><br></p><p><b>Step 2 \u2013 Seek Pre-Approval for Any Loans</b></p><p>When you are purchasing property, it can be quite beneficial to get pre-approval for any loans that will be involved. This will help to avoid significant delays should you find a property that fits your exact specifications. As the housing market in Australia is strong, many properties have a very short shelf life on the open-market. While other prospective buyers are still getting the necessary loan paperwork together, you could be acting on purchasing a solid investment. Getting a loan before beginning the search for investment property is imperative.</p><p><br></p><p><b>Step 3 \u2013 Apply for Pre-Approval From the Australian Government</b></p><p>International investors must apply to the Foreign Investment Review Board (FIRB) if they would like to purchase domestic properties. Having this paperwork in hand will also help you avoid any delays when the property purchasing process is underway.</p><p><br></p><p><b>Step 4 \u2013 Begin Searching for Properties</b></p><p>Now that all of the necessary paperwork and loan information has been completed, it\u2019s time to find the perfect property. Century 21 has one of the most comprehensive listings of properties in Australia, and will be perfect place to start your search.</p><p><br></p><p><b>Step 5 \u2013 Enter Negotiations Regarding the Purchase Price</b></p><p>Once you\u2019ve found a property that meets your purchasing criteria, the negotiation process begins. The nature of such negotiations will differ, as different regions experience variances in demand. Throughout these negotiations, you will have access to all of the important contractual information. Your conveyancer or solicitor will give you an overview of the contract, ensuring that everything is perfect before signing. Should any additional provisions or conditions be required, this is when the paperwork will be amended. The property laws in each Australian state will vary, and this is where a conveyancer\u2019s expertise will prove its worth. Now that an agreed purchase price has been reached, your solicitor or conveyancer will finalise the information and let you know when to proceed to sign the contract and purchase the property. An additional point worth noting: before signing the contract, be sure that the clause \u201csubject to FIRB approval\u201d is present. If it isn\u2019t, the contract is in breach of Australian law</p><p><br></p><p><b>Step 6 \u2013 Finalise the Formal Loan Approval</b></p><p>Though you\u2019ve been pre-approved for your property mortgage amount, there is still a finalisation that must occur. It will be essential to forward the sale contract to the mortgage provider.</p><p><br></p><p><b>Step 7 \u2013 Complete the Contract Exchange and Pay the Deposit</b></p><p>Once the loan has been formally approved and your conveyancer or solicitor has given you full approval to move forward, you can exchange contracts with the property agent. A deposit is generally required, and there is no set standard to the amount. Once the contracts have been exchanged, the process is nearing the point of completion.The aforementioned \u201csubject to FIRB approval\u201d clause is very important and must be included in the contract. The clause must be stated properly, so consult your conveyancer or solicitor to avoid a rejection of the FIRB proposal.</p><p><br></p><p><b>Step 8 \u2013 Finalise Necessary Arrangements</b></p><p>The FIRB will need a copy of the contract for formal approval, so once they have been exchanged, forward one to the organisation. Consult with your mortgage provider, solicitor, or conveyancer to get any clarification should it be necessary. Legal advice is always recommended, and you have the right to seek it.</p><p><br></p><p><b>Step 9 \u2013 Settlement</b></p><p>This is the final phase of the process and includes the exchange of the property\u2019s ownership. Your mortgage provider and conveyancer or solicitor will handle all of the proceedings, so your presence isn\u2019t necessary. The real estate agent will have your keys and the title to the property will be held by your lending institution.</p>";

const cleanedContent = normalizeLegacyHtml(CONTENT);

export default function Page() {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Same hero technique/height as About/Contact — see those pages'
          hero comments. Reuses the homepage's hero-banner.webp, same as the
          other "Buy" utility pages (no dedicated banner photo exists yet
          for any of these). */}
      <section className="relative overflow-hidden h-72.75 -mt-14.25 min-[430px]:h-68.25 min-[430px]:-mt-7.25 sm:h-75.5 sm:-mt-8.25 lg:h-73.25 lg:mt-0">
        <Image
          src="/images/hero-banner.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/65 to-black/45" />
        <div className="absolute inset-x-0 bottom-0 h-58.5 min-[430px]:h-61 sm:h-67.25 lg:h-73.25 flex flex-col items-center justify-center text-center text-white px-4">
          <p className="text-shadow-hero text-sm text-white/80">
            <Link href="/" className="hover:text-brand-gold">Home</Link> / Buyers Advisory
          </p>
          <h1 className="text-shadow-hero mt-3 font-display text-5xl sm:text-6xl">Buyers Advisory</h1>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        {/* Same typography treatment as blog/property content — text-xl/
            font-medium/leading-[1.85], one uniform mb-8 per block. The
            block itself fills the page's already-centered container width
            (no narrower max-w constraint pinching it into a slim, heavily-
            margined column) — text stays normally left-aligned; only the
            block's position is centered, not each line of text. The
            "Step N – …" labels are plain <b> tags with no inline styling
            of their own (so normalizeLegacyHtml's size/weight-preserving
            heuristic doesn't apply — that only fires on spans that already
            carry an inline style), so they're promoted to look like real
            subheadings directly here: the display font, bumped up a size,
            and set as their own block instead of just inline-bold text the
            same size as the body. */}
        <div
          className="text-xl font-medium text-slate-600 leading-[1.85] [&_:is(p,li,h1,h2,h3,h4,h5,h6)]:mb-8 [&_b]:font-display [&_b]:block [&_b]:text-2xl [&_b]:text-brand-navy"
          dangerouslySetInnerHTML={{ __html: cleanedContent }}
        />
      </div>
    </div>
  );
}
