import { notFound } from "next/navigation";
import dbConnect from "@/lib/db";
import Redirect from "@/models/Redirect";
import { updateRedirect } from "@/actions/redirect.actions";
import RedirectForm from "@/components/admin/RedirectForm";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

async function getRedirect(id: string) {
  await dbConnect();
  return await Redirect.findById(id).lean();
}

export default async function EditRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const redirect = await getRedirect(id);
  if (!redirect) notFound();

  const updateWithId = async (formData: FormData) => {
    "use server";
    await updateRedirect(id, formData);
  };

  return (
    <div>
      <AdminPageHeader title="Edit Redirect" />
      <RedirectForm action={updateWithId} defaultValues={redirect} submitLabel="Save Changes" />
    </div>
  );
}
