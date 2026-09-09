import { createProperty } from "@/actions/property.actions";
import { getAgents } from "@/lib/queries";
import { toPlainObject } from "@/lib/serialize";
import PropertyForm from "@/components/admin/PropertyForm";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default async function NewPropertyPage() {
  const agents = await getAgents();

  return (
    <div>
      <AdminPageHeader title="New Listing" />
      <PropertyForm action={createProperty} agents={toPlainObject(agents)} submitLabel="Create Listing" />
    </div>
  );
}
