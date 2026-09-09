import { createAgent } from "@/actions/agent.actions";
import AgentForm from "@/components/admin/AgentForm";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default function NewAgentPage() {
  return (
    <div>
      <AdminPageHeader title="New Agent" />
      <AgentForm action={createAgent} submitLabel="Create Agent" />
    </div>
  );
}
