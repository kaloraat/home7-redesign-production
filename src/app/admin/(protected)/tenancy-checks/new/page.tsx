import { createReferenceRequest } from "@/actions/tenancyReference.actions";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const inputClass = "w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white";

export default function NewTenancyCheckPage() {
  return (
    <div>
      <AdminPageHeader
        title="Request a Tenancy Reference"
        description="Emails the applicant's previous agent a link to fill out a reference check."
      />

      <form action={createReferenceRequest} className="mt-6 space-y-4 max-w-lg">
        <fieldset className="space-y-4">
          <legend className="font-semibold text-slate-900 mb-1">Tenant / Applicant</legend>
          <input name="tenantName" placeholder="Tenant's full name" required className={inputClass} />
          <input
            name="tenantAddress"
            placeholder="Address of the property they're applying for"
            required
            className={inputClass}
          />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-semibold text-slate-900 mb-1">Previous Agent</legend>
          <input name="agentName" placeholder="Agent's name" required className={inputClass} />
          <input name="jobPosition" placeholder="Job position (optional)" className={inputClass} />
          <input name="agencyName" placeholder="Agency name" required className={inputClass} />
          <input
            name="agentEmail"
            type="email"
            placeholder="Agent's email — the request goes here"
            required
            className={inputClass}
          />
        </fieldset>

        <button
          type="submit"
          className="bg-brand-gold text-brand-navy rounded px-5 py-2.5 font-semibold hover:brightness-95 transition cursor-pointer"
        >
          Send Reference Request
        </button>
      </form>
    </div>
  );
}
