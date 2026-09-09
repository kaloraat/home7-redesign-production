import type { IAgent } from "@/models/Agent";
import ImageUploader from "./ImageUploader";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  defaultValues?: Partial<IAgent>;
  submitLabel: string;
};

const inputClass = "w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white";

export function AgentForm({ action, defaultValues, submitLabel }: Props) {
  const d = defaultValues ?? {};

  return (
    <form action={action} className="mt-6 space-y-6 max-w-2xl">
      <fieldset className="space-y-4">
        <legend className="font-semibold text-slate-900 mb-1">Profile</legend>
        <div className="grid grid-cols-2 gap-4">
          <input name="name" placeholder="Full name" defaultValue={d.name} required className={inputClass} />
          <input name="role" placeholder="Role, e.g. Sales Consultant" defaultValue={d.role} required className={inputClass} />
        </div>
        <textarea name="bio" placeholder="Short bio" rows={4} defaultValue={d.bio} className={inputClass} />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-semibold text-slate-900 mb-1">Contact</legend>
        <div className="grid grid-cols-2 gap-4">
          <input name="phone" placeholder="Phone" defaultValue={d.phone} className={inputClass} />
          <input name="mobile" placeholder="Mobile" defaultValue={d.mobile} className={inputClass} />
          <input name="whatsapp" placeholder="WhatsApp" defaultValue={d.whatsapp} className={inputClass} />
          <input name="email" type="email" placeholder="Email" defaultValue={d.email} className={inputClass} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-semibold text-slate-900 mb-1">Social</legend>
        <div className="grid grid-cols-2 gap-4">
          <input name="facebook" placeholder="Facebook URL" defaultValue={d.facebook} className={inputClass} />
          <input name="linkedin" placeholder="LinkedIn URL" defaultValue={d.linkedin} className={inputClass} />
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="font-semibold text-slate-900 mb-1">Photo</legend>
        <p className="text-xs text-slate-500">
          Resized and compressed in your browser before upload.
        </p>
        <ImageUploader
          name="photo"
          defaultValue={d.photo ? [d.photo] : []}
          folder="agents"
          slug={d.slug}
          multiple={false}
        />
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-semibold text-slate-900 mb-1">Display</legend>
        <div>
          <label className="block text-sm text-slate-600 mb-1">
            Order (lower shows first — Principal is usually 0)
          </label>
          <input
            name="order"
            type="number"
            defaultValue={d.order ?? 0}
            className={`${inputClass} max-w-32`}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="active" defaultChecked={d.active ?? true} />
          Show on the public site
        </label>
      </fieldset>

      <button
        type="submit"
        className="bg-brand-gold text-brand-navy rounded px-5 py-2.5 font-semibold hover:brightness-95 transition cursor-pointer"
      >
        {submitLabel}
      </button>
    </form>
  );
}

export default AgentForm;
