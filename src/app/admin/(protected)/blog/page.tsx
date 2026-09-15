import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Content from "@/models/Content";
import { deleteContent } from "@/actions/content.actions";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CreatedToast from "@/components/admin/CreatedToast";
import DeleteButton from "@/components/admin/DeleteButton";

async function getAll() {
  try {
    await dbConnect();
    return await Content.find({}).sort({ createdAt: -1 }).lean();
  } catch {
    return [];
  }
}

export default async function AdminBlogPage() {
  const [session, posts] = await Promise.all([auth(), getAll()]);
  // Deleting is owner-only — see lib/authz.ts.
  const isOwner = session?.user.role === "owner";

  return (
    <div>
      <Suspense fallback={null}>
        <CreatedToast message="Post created." />
      </Suspense>
      <AdminPageHeader
        title="Blog"
        description="Posts at /blog/{slug} and top-level SEO pages at /{slug}."
        action={{ label: "+ New Post", href: "/admin/blog/new" }}
      />

      {posts.length === 0 ? (
        <p className="mt-8 text-slate-500">No posts yet.</p>
      ) : (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white overflow-hidden">
          {/* overflow-x-auto on this inner wrapper (not the outer div,
              which needs overflow-hidden to clip the header row's bg
              color to the card's rounded corners) is what lets the table
              actually scroll sideways on a narrow screen — min-w-max on
              the table stops columns from squishing to fit instead. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50">
                <th className="py-3 px-4 font-medium">Title</th>
                <th className="py-3 px-4 font-medium">URL</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Updated</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={String(p._id)} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">{p.title}</td>
                  <td className="py-3 px-4 text-slate-500">
                    {p.urlPath === "blog"
                      ? `/blog/${p.slug}`
                      : p.urlPath === "suburb"
                        ? `/suburb/${p.slug}`
                        : `/${p.slug}`}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === "published" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {p.status === "published" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(p.updatedAt).toLocaleDateString("en-AU")}
                  </td>
                  <td className="py-3 px-4 text-right space-x-3 whitespace-nowrap">
                    <Link href={`/admin/blog/${p._id}/edit`} className="text-brand-gold-dark hover:underline">
                      Edit
                    </Link>
                    {isOwner && (
                      <DeleteButton onConfirm={deleteContent.bind(null, String(p._id))} itemLabel="this post" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
