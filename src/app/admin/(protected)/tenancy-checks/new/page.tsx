import AdminPageHeader from "@/components/admin/AdminPageHeader";
import NewTenancyCheckForm from "@/components/admin/NewTenancyCheckForm";

export default function NewTenancyCheckPage() {
  return (
    <div>
      <AdminPageHeader
        title="Request a Tenancy Reference"
        description="Emails the applicant's previous agent a link to fill out a reference check."
      />

      <NewTenancyCheckForm />
    </div>
  );
}
