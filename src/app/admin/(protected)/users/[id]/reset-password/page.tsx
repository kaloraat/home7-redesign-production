import { notFound } from "next/navigation";
import dbConnect from "@/lib/db";
import Admin from "@/models/Admin";
import { resetAdminPassword } from "@/actions/admin.actions";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

async function getAdmin(id: string) {
  await dbConnect();
  return await Admin.findById(id).select("name email").lean();
}

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = await getAdmin(id);
  if (!admin) notFound();

  const resetWithId = async (formData: FormData) => {
    "use server";
    await resetAdminPassword(id, formData);
  };

  return (
    <div>
      <AdminPageHeader title="Reset Password" description={`For ${admin.name} (${admin.email})`} />
      <form action={resetWithId} className="mt-6 space-y-4 max-w-sm">
        <input
          name="password"
          type="password"
          placeholder="New password (min. 8 characters)"
          required
          minLength={8}
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
        />
        <button
          type="submit"
          className="bg-brand-gold text-brand-navy rounded px-5 py-2.5 font-semibold hover:brightness-95 transition cursor-pointer"
        >
          Set New Password
        </button>
      </form>
    </div>
  );
}
