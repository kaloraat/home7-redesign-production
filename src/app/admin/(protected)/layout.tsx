import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

// This layout only wraps the (protected) route group — /admin/login sits
// outside it — so redirecting here never creates a login-page redirect loop.
// requireAdmin()-style checks in each Server Action stop unauthenticated
// writes, but this is what stops an unauthenticated visitor from even
// *viewing* the dashboard/listings/forms in the first place.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/admin/login" });
  }

  return (
    // h-screen + overflow-hidden pins this shell to exactly the viewport
    // height instead of growing with page content (the previous
    // min-h-screen did) — that's what makes the sidebar below actually stay
    // put rather than scrolling away with the page. main gets its own
    // overflow-y-auto so IT scrolls internally while the sidebar doesn't
    // move at all.
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      {/* Clean redesign of the previous bare-bones sidebar — brand colors/
          fonts matching the public site, icons + a one-line description per
          nav item, flat (no nested dropdowns) since the item count stays
          small enough to list flat. Auto-collapses to icon-only on a small
          screen with a manual toggle either way — see AdminSidebar. See the
          admin-dashboard-rebuild memory checklist for the full plan this
          shell is phase 0 of. */}
      <AdminSidebar userEmail={session.user.email ?? ""} signOutAction={signOutAction} />

      {/* overflow-x-auto: a data table (Properties/Leads/etc.) wider than a
          narrow viewport now scrolls sideways to reveal it, instead of the
          excess just being clipped off with no way to reach it. */}
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-auto p-6 sm:p-8">{children}</main>
    </div>
  );
}
