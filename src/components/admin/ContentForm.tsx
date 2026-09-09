"use client";

import { useState } from "react";
import type { IContent } from "@/models/Content";
import { TARGET_SUBURBS } from "@/lib/constants";
import { useDraftAutosave } from "@/lib/useDraftAutosave";
import DraftSavingIndicator from "./DraftSavingIndicator";
import ImageUploader from "./ImageUploader";
import RichTextEditor from "./RichTextEditor";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  defaultValues?: Partial<IContent>;
  submitLabel: string;
  /** Locked once a post exists — urlPath decides whether it's /blog/{slug}
   * or /{slug}, and changing that after the URL is live would break it. */
  urlPathLocked?: boolean;
};

const inputClass = "w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white";

const DRAFT_KEY = "home7-admin-content-create-draft";

// Same idea as PropertyForm's draftToDefaultValues — reuses the exact
// shape `defaultValues` already knows how to initialize the form from.
function draftToDefaultValues(raw: Record<string, string>): Partial<IContent> {
  return {
    title: raw.title || undefined,
    excerpt: raw.excerpt || undefined,
    bodyHtml: raw.bodyHtml || undefined,
    coverImage: raw.coverImage || undefined,
    urlPath: (raw.urlPath as IContent["urlPath"]) || undefined,
    status: (raw.status as IContent["status"]) || undefined,
    targetSuburb: raw.targetSuburb || undefined,
    seoTitle: raw.seoTitle || undefined,
    seoDescription: raw.seoDescription || undefined,
  };
}

function BodyField({ defaultValue, slug }: { defaultValue?: string; slug?: string }) {
  const [bodyHtml, setBodyHtml] = useState(defaultValue ?? "");
  return (
    <>
      <input type="hidden" name="bodyHtml" value={bodyHtml} />
      <RichTextEditor defaultValue={defaultValue} onChange={setBodyHtml} folder="blog" slug={slug} />
    </>
  );
}

// Not a hard technical limit — nothing rejects a longer value — this is
// Google's own typical desktop search-snippet truncation point (~155–160
// characters is the standard SEO-tooling convention, e.g. Yoast/Moz both
// guide toward this same range). Past it, Google just cuts the text with
// "…" wherever that lands, which can land mid-word/mid-sentence — worth
// staying under, not enforcing.
const RECOMMENDED_META_LENGTH = 160;

// Shared by the excerpt and SEO-description fields below — both feed the
// same <meta name="description"> tag (excerpt only when seoDescription is
// left blank — see content.actions.ts), so both share the same real-world
// length concern. A live count, not a maxLength attribute: excerpt also
// doubles as the on-page card teaser (which handles overflow on its own
// via line-clamp), so it's still valid to run longer there deliberately
// as long as a separate, shorter SEO Description is set to actually carry
// the meta tag instead.
function CountedTextarea({
  name,
  placeholder,
  defaultValue,
  rows,
  helpText,
}: {
  name: string;
  placeholder: string;
  defaultValue?: string;
  rows: number;
  helpText: string;
}) {
  const [length, setLength] = useState((defaultValue ?? "").length);
  const over = length > RECOMMENDED_META_LENGTH;
  const near = !over && length > RECOMMENDED_META_LENGTH - 20;

  return (
    <div>
      <textarea
        name={name}
        placeholder={placeholder}
        rows={rows}
        defaultValue={defaultValue}
        onChange={(e) => setLength(e.target.value.length)}
        className={inputClass}
      />
      <p className={`mt-1 text-xs ${over ? "text-red-600" : near ? "text-amber-600" : "text-slate-400"}`}>
        {length} / {RECOMMENDED_META_LENGTH} recommended — {helpText}
      </p>
    </div>
  );
}

export function ContentForm({ action, defaultValues, submitLabel, urlPathLocked }: Props) {
  const isCreate = !defaultValues;
  const { formRef, draftValues, showSavedIndicator, clearDraftOnSubmit } = useDraftAutosave(
    DRAFT_KEY,
    isCreate,
    draftToDefaultValues
  );
  const d = (isCreate ? draftValues : defaultValues) ?? {};

  // Forces every field (including ImageUploader's own internal state,
  // initialized once from its defaultValue prop) to re-initialize cleanly
  // from the restored draft the moment it loads — see PropertyForm's own
  // formKey for the fuller explanation of why a remount is simpler and
  // more reliable than patching a dozen already-mounted inputs by hand.
  const formKey = isCreate ? (draftValues ? "draft" : "empty") : "edit";

  return (
    <>
    <DraftSavingIndicator show={isCreate && showSavedIndicator} />
    <form ref={formRef} key={formKey} action={action} onSubmit={clearDraftOnSubmit} className="mt-6 space-y-6 max-w-4xl">
      <fieldset className="space-y-4">
        <legend className="font-semibold text-slate-900 mb-1">Post</legend>
        <input name="title" placeholder="Title" defaultValue={d.title} required className={inputClass} />
        <CountedTextarea
          name="excerpt"
          placeholder="Short excerpt — shown on blog cards and used as a fallback meta description"
          rows={2}
          defaultValue={d.excerpt}
          helpText="used as the meta description (search-result snippet) unless you set a separate SEO Description below."
        />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="font-semibold text-slate-900 mb-1">Content</legend>
        <BodyField defaultValue={d.bodyHtml} slug={d.slug} />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="font-semibold text-slate-900 mb-1">Cover image</legend>
        <ImageUploader
          name="coverImage"
          defaultValue={d.coverImage ? [d.coverImage] : []}
          folder="blog"
          slug={d.slug}
          multiple={false}
        />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-semibold text-slate-900 mb-1">Publishing</legend>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">URL</label>
            <select
              name="urlPath"
              defaultValue={d.urlPath ?? "blog"}
              disabled={urlPathLocked}
              className={`${inputClass} ${urlPathLocked ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <option value="blog">/blog/{"{slug}"} (Recommended)</option>
              <option value="root">/{"{slug}"} (top-level page)</option>
              <option value="suburb">/suburb/{"{slug}"} (local-SEO landing page)</option>
            </select>
            {urlPathLocked && (
              <p className="mt-1 text-xs text-slate-400">Can&apos;t change once published — the URL stays live.</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Status</label>
            {/* Defaults to Published on create — existing posts still show
                their own real status on edit (d.status wins whenever it's
                actually set; this fallback only applies when it's absent,
                i.e. a brand-new post). */}
            <select name="status" defaultValue={d.status ?? "published"} className={inputClass}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">
            Target suburb
          </label>
          {/* A suburb page's identity IS this field — it's how the page
              queries live listings for that suburb (Property.suburb match),
              so it has to be an exact TARGET_SUBURBS value, not free text.
              Also usable to tag a blog post as suburb-focused for internal
              tracking, even when the post's own urlPath isn't "suburb". */}
          <select name="targetSuburb" defaultValue={d.targetSuburb ?? ""} className={inputClass}>
            <option value="">— None —</option>
            {TARGET_SUBURBS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-semibold text-slate-900 mb-1">SEO (optional)</legend>
        <input
          name="seoTitle"
          placeholder="Meta title override"
          defaultValue={d.seoTitle}
          className={inputClass}
        />
        <CountedTextarea
          name="seoDescription"
          placeholder="Meta description override"
          rows={2}
          defaultValue={d.seoDescription}
          helpText="this replaces the excerpt above as the meta description whenever it's set."
        />
      </fieldset>

      <button
        type="submit"
        className="bg-brand-gold text-brand-navy rounded px-5 py-2.5 font-semibold hover:brightness-95 transition cursor-pointer"
      >
        {submitLabel}
      </button>
    </form>
    </>
  );
}

export default ContentForm;
