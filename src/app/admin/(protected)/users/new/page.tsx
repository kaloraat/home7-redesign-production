import { createAdminUser } from "@/actions/admin.actions";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const inputClass = "w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white";

export default function NewAdminUserPage() {
  return (
    <div>
      <AdminPageHeader title="New Admin User" />
      <form action={createAdminUser} className="mt-6 space-y-4 max-w-sm">
        <input name="name" placeholder="Full name" required className={inputClass} />
        <input name="email" type="email" placeholder="Email" required className={inputClass} />
        <input
          name="password"
          type="password"
          placeholder="Password (min. 8 characters)"
          required
          minLength={8}
          className={inputClass}
        />
        <div>
          <label className="block text-sm text-slate-600 mb-1">Role</label>
          <select name="role" defaultValue="editor" className={inputClass}>
            <option value="editor">Editor</option>
            <option value="owner">Owner (can manage other admin accounts)</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-brand-gold text-brand-navy rounded px-5 py-2.5 font-semibold hover:brightness-95 transition cursor-pointer"
        >
          Create Admin
        </button>
      </form>
    </div>
  );
}
