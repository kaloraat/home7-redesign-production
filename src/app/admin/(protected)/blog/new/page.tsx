import { createContent } from "@/actions/content.actions";
import ContentForm from "@/components/admin/ContentForm";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default function NewContentPage() {
  return (
    <div>
      <AdminPageHeader title="New Post" />
      <ContentForm action={createContent} submitLabel="Create Post" />
    </div>
  );
}
