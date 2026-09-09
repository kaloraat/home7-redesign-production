import { notFound } from "next/navigation";
import dbConnect from "@/lib/db";
import Agent from "@/models/Agent";
import { updateAgent } from "@/actions/agent.actions";
import AgentForm from "@/components/admin/AgentForm";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

async function getAgent(id: string) {
  await dbConnect();
  return await Agent.findById(id).lean();
}

export default async function EditAgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = await getAgent(id);
  if (!agent) notFound();

  const updateWithId = async (formData: FormData) => {
    "use server";
    await updateAgent(id, formData);
  };

  return (
    <div>
      <AdminPageHeader
        title="Edit Agent"
        description={`URL: /agent/${agent.slug} — the slug never changes on edit.`}
      />
      <AgentForm action={updateWithId} defaultValues={agent} submitLabel="Save Changes" />
    </div>
  );
}
