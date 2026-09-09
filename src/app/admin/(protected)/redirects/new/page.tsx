import { createRedirect } from "@/actions/redirect.actions";
import RedirectForm from "@/components/admin/RedirectForm";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default function NewRedirectPage() {
  return (
    <div>
      <AdminPageHeader title="New Redirect" />
      <RedirectForm action={createRedirect} submitLabel="Create Redirect" />
    </div>
  );
}
