import { notFound } from "next/navigation";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import { updateProperty } from "@/actions/property.actions";
import { getAgents } from "@/lib/queries";
import { toPlainObject } from "@/lib/serialize";
import PropertyForm from "@/components/admin/PropertyForm";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

async function getProperty(id: string) {
  await dbConnect();
  return await Property.findById(id).lean();
}

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [property, agents] = await Promise.all([getProperty(id), getAgents()]);

  if (!property) notFound();

  const updateWithId = async (formData: FormData) => {
    "use server";
    await updateProperty(id, formData);
  };

  return (
    <div>
      <AdminPageHeader
        title="Edit Listing"
        description={`URL: /property/${property.slug} — the slug never changes on edit.`}
      />
      <PropertyForm
        action={updateWithId}
        agents={toPlainObject(agents)}
        defaultValues={toPlainObject(property)}
        submitLabel="Save Changes"
      />
    </div>
  );
}
