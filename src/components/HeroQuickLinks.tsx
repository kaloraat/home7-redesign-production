import Link from "next/link";

const QUICK_LINKS = [
  {
    label: "Buy",
    href: "/properties-for-sale",
    icon: (
      <path
        d="M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
  {
    label: "Sell",
    href: "/free-market-appraisal?key=selling",
    icon: (
      <path
        d="M12 2v20m5-17H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
  {
    label: "Rent",
    href: "/properties-for-rent",
    icon: (
      <path
        d="M4 4h16v5H4V4Zm0 5v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9M9 13h6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
];

export function HeroQuickLinks() {
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      {QUICK_LINKS.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          className="group relative flex items-center gap-2 rounded-full border border-white/30 bg-white/5 backdrop-blur-sm px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-white overflow-hidden transition-all duration-300 hover:border-brand-gold hover:shadow-[0_8px_24px_-8px_rgba(244,202,116,0.6)]"
        >
          <span className="absolute inset-0 -z-10 origin-left scale-x-0 bg-gradient-to-r from-brand-gold to-brand-gold-dark transition-transform duration-300 ease-out group-hover:scale-x-100" />
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            className="text-brand-gold transition-colors duration-300 group-hover:text-brand-navy"
          >
            {link.icon}
          </svg>
          <span className="transition-colors duration-300 group-hover:text-brand-navy">
            {link.label}
          </span>
        </Link>
      ))}
    </div>
  );
}

export default HeroQuickLinks;
