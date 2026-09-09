"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardIcon,
  BuildingIcon,
  UsersIcon,
  DocumentIcon,
  InboxIcon,
  LinkIcon,
  ClipboardCheckIcon,
  UserCogIcon,
} from "@/components/admin/icons";

// Flat nav — every item one click away, no nested dropdowns to expand/
// collapse (explicit request: the item count here is small enough that a
// flat list stays scannable without needing to group anything behind a
// submenu). `description` renders as a small line under the label so it's
// clear what each section does without having to click into it first.
const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", description: "Overview & stats", icon: DashboardIcon, exact: true },
  { href: "/admin/properties", label: "Properties", description: "Buy, rent & sold listings", icon: BuildingIcon },
  { href: "/admin/agents", label: "Agents", description: "Team profiles", icon: UsersIcon },
  { href: "/admin/blog", label: "Blog", description: "Posts & articles", icon: DocumentIcon },
  { href: "/admin/leads", label: "Leads", description: "Enquiries from every form", icon: InboxIcon },
  { href: "/admin/redirects", label: "Redirects", description: "Old URLs → new URLs", icon: LinkIcon },
  { href: "/admin/tenancy-checks", label: "Tenancy Checks", description: "Rental reference requests", icon: ClipboardCheckIcon },
  { href: "/admin/rental-applications", label: "Rental Applications", description: "Tenant application submissions", icon: ClipboardCheckIcon },
  { href: "/admin/users", label: "Admin Users", description: "Who can sign in here", icon: UserCogIcon },
];

export function AdminNav({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map(({ href, label, description, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            // Icon-only rows lose the label text visually, so the same
            // label+description still needs to reach anyone hovering
            // (native title tooltip) or using a screen reader (aria-label)
            // — collapsed isn't just "smaller", it's "the same nav with
            // text hidden," not a different, less-described nav.
            title={collapsed ? `${label} — ${description}` : undefined}
            aria-label={collapsed ? `${label} — ${description}` : undefined}
            className={`flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors ${
              collapsed ? "justify-center" : ""
            } ${active ? "bg-brand-navy text-white" : "text-slate-600 hover:bg-slate-100 hover:text-brand-navy"}`}
          >
            <Icon
              size={18}
              className={`shrink-0 ${collapsed ? "" : "mt-0.5"} ${active ? "text-brand-gold" : "text-slate-400"}`}
            />
            {!collapsed && (
              <span>
                <span className="block text-sm font-medium leading-tight">{label}</span>
                <span className={`block text-xs leading-tight ${active ? "text-white/70" : "text-slate-400"}`}>
                  {description}
                </span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export default AdminNav;
