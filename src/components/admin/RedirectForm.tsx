import type { IRedirect } from "@/models/Redirect";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  defaultValues?: Partial<IRedirect>;
  submitLabel: string;
};

const inputClass = "w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white font-mono";

export function RedirectForm({ action, defaultValues, submitLabel }: Props) {
  const d = defaultValues ?? {};

  return (
    <form action={action} className="mt-6 space-y-4 max-w-lg">
      <div>
        <label className="block text-sm text-slate-600 mb-1">From path</label>
        <input name="fromPath" placeholder="/old-page" defaultValue={d.fromPath} required className={inputClass} />
      </div>
      <div>
        <label className="block text-sm text-slate-600 mb-1">To path</label>
        <input name="toPath" placeholder="/new-page" defaultValue={d.toPath} required className={inputClass} />
      </div>
      <div>
        <label className="block text-sm text-slate-600 mb-1">Status code</label>
        <select name="statusCode" defaultValue={d.statusCode ?? 301} className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white">
          <option value={301}>301 — Permanent</option>
          <option value={302}>302 — Temporary</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-slate-600 mb-1">Note (optional)</label>
        <input
          name="note"
          placeholder="Why this redirect exists"
          defaultValue={d.note}
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
        />
      </div>

      <button
        type="submit"
        className="bg-brand-gold text-brand-navy rounded px-5 py-2.5 font-semibold hover:brightness-95 transition cursor-pointer"
      >
        {submitLabel}
      </button>
    </form>
  );
}

export default RedirectForm;
