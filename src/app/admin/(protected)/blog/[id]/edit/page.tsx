import { notFound } from "next/navigation";
import dbConnect from "@/lib/db";
import Content from "@/models/Content";
import { updateContent } from "@/actions/content.actions";
import { toPlainObject } from "@/lib/serialize";
import ContentForm from "@/components/admin/ContentForm";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

async function getPost(id: string) {
  await dbConnect();
  return await Content.findById(id).lean();
}

export default async function EditContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  const updateWithId = async (formData: FormData) => {
    "use server";
    await updateContent(id, formData);
  };

  const publicPath =
    post.urlPath === "blog"
      ? `/blog/${post.slug}`
      : post.urlPath === "suburb"
        ? `/suburb/${post.slug}`
        : `/${post.slug}`;

  return (
    <div>
      <AdminPageHeader
        title="Edit Post"
        description={`URL: ${publicPath} — the URL never changes on edit.`}
      />
      <ContentForm action={updateWithId} defaultValues={toPlainObject(post)} submitLabel="Save Changes" urlPathLocked />
    </div>
  );
}
