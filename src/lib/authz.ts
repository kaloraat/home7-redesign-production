import { auth } from "@/auth";

/**
 * Baseline check every admin server action uses — any signed-in admin,
 * "owner" or "editor" alike. Every actions/*.ts file used to define an
 * identical copy of this locally; centralized here so requireOwner below
 * can build on it, and so the two checks can't drift out of sync across
 * files.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authorized");
  }
  return session;
}

/**
 * Owner-only. An "editor" admin (e.g. office staff given a login without
 * full trust) can create and edit everything in the dashboard — listings,
 * blog posts, agents, redirects, tenancy reference checks — but permanently
 * deleting a record is reserved for an "owner". Used by every delete*
 * action, and by admin.actions.ts for managing other admin accounts
 * (adding/removing logins is itself an owner-only, delete-adjacent power).
 */
export async function requireOwner() {
  const session = await requireAdmin();
  if (session.user.role !== "owner") {
    throw new Error("Only an owner can delete this — ask an owner to do it for you.");
  }
  return session;
}
