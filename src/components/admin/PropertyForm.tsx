"use client";

import { useState } from "react";
import type { IAgent } from "@/models/Agent";
import type { IProperty } from "@/models/Property";
import { PROPERTY_TYPES } from "@/lib/constants";
import { useDraftAutosave } from "@/lib/useDraftAutosave";
import AmenitiesInput from "./AmenitiesInput";
import DateInput from "@/components/DateInput";
import DraftSavingIndicator from "./DraftSavingIndicator";
import ImageUploader from "./ImageUploader";
import LandSizeInput from "./LandSizeInput";
import PropertyAddressFields from "./PropertyAddressFields";
import RichTextEditor from "./RichTextEditor";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  agents: IAgent[];
  defaultValues?: Partial<IProperty>;
  submitLabel: string;
};

function toDateInputValue(date?: Date | string) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

// Only one draft at a time — this is "New Listing", not per-listing, so
// coming back to an empty create form always resumes the same in-progress
// draft rather than needing to track which specific listing it belonged to
// (an edit form never uses this at all — see formDraft.ts).
const DRAFT_KEY = "home7-admin-property-create-draft";

// Maps a raw `{fieldName: string}` snapshot (exactly what FormData sees)
// back into the same shape PropertyForm already knows how to initialize
// itself from via `defaultValues` — reusing that path means every
// subcomponent's own restore logic (address autocomplete, land size unit
// parsing, image gallery, rich text) comes for free instead of needing a
// second, separate restore implementation per field.
function draftToDefaultValues(raw: Record<string, string>): Partial<IProperty> {
  const num = (v?: string) => (v ? Number(v) : undefined);
  return {
    address: raw.address || undefined,
    suburb: raw.suburb || undefined,
    postcode: raw.postcode || undefined,
    listingType: (raw.listingType as IProperty["listingType"]) || undefined,
    priceDisplay: raw.priceDisplay || undefined,
    priceValue: num(raw.priceValue),
    rentPerWeek: num(raw.rentPerWeek),
    featured: raw.featured === "on",
    auctionDate: raw.auctionDate || undefined,
    agent: raw.agent || undefined,
    bedrooms: num(raw.bedrooms),
    bathrooms: num(raw.bathrooms),
    toilets: num(raw.toilets),
    carSpaces: num(raw.carSpaces),
    landSize: raw.landSize || undefined,
    floorSize: raw.floorSize || undefined,
    propertyType: raw.propertyType || undefined,
    description: raw.description || undefined,
    images: raw.images ? raw.images.split("\n").filter(Boolean) : undefined,
    floorPlanImage: raw.floorPlanImage || undefined,
    amenities: raw.amenities ? raw.amenities.split("\n").filter(Boolean) : undefined,
    mapEmbedUrl: raw.mapEmbedUrl || undefined,
    videoEmbedUrl: raw.videoEmbedUrl || undefined,
    seoTitle: raw.seoTitle || undefined,
    seoDescription: raw.seoDescription || undefined,
    // agent/auctionDate above are plain strings here, not the ObjectId/Date
    // Partial<IProperty> declares — every place this form actually reads
    // them (d.agent?.toString(), toDateInputValue(d.auctionDate)) already
    // accepts a plain string just as well, so this is safe at runtime.
  } as unknown as Partial<IProperty>;
}

function DescriptionField({ defaultValue, slug }: { defaultValue?: string; slug?: string }) {
  const [description, setDescription] = useState(defaultValue ?? "");
  return (
    <div>
      <label className="block text-sm text-slate-600 mb-1">Description</label>
      <input type="hidden" name="description" value={description} />
      <RichTextEditor defaultValue={defaultValue} onChange={setDescription} folder="properties" slug={slug} />
    </div>
  );
}

export function PropertyForm({ action, agents, defaultValues, submitLabel }: Props) {
  const isCreate = !defaultValues;
  const { formRef, draftValues, showSavedIndicator, clearDraftOnSubmit } = useDraftAutosave(
    DRAFT_KEY,
    isCreate,
    draftToDefaultValues
  );

  const d = (isCreate ? draftValues : defaultValues) ?? {};

  // Mohammed handles the large majority of listings — default a *new*
  // listing to him so the common case needs no extra click, while an
  // existing listing's own saved agent (d.agent, including a deliberate
  // "— None —") always takes precedence over this default. Looked up by
  // name against the real `agents` list rather than a hardcoded id, so
  // this doesn't silently point at nothing (or the wrong agent) if the DB
  // is ever reseeded with different ids.
  const defaultAgentId =
    d.agent?.toString() ?? agents.find((a) => a.name === "Mohammed R Islam")?._id?.toString() ?? "";

  // Forces every field below (including each subcomponent's own internal
  // state, initialized once from its defaultValue/default* props) to
  // re-initialize cleanly from the restored draft the moment it loads —
  // simpler and far less fragile than trying to imperatively patch a dozen
  // already-mounted controlled/uncontrolled inputs individually.
  const formKey = isCreate ? (draftValues ? "draft" : "empty") : "edit";

  return (
    <>
    <DraftSavingIndicator show={isCreate && showSavedIndicator} />
    <form ref={formRef} key={formKey} action={action} onSubmit={clearDraftOnSubmit} className="mt-6 space-y-6 max-w-2xl">
      <fieldset className="space-y-4">
        <legend className="font-semibold text-slate-900 mb-1">Address</legend>
        <PropertyAddressFields defaultAddress={d.address} defaultSuburb={d.suburb} defaultPostcode={d.postcode} />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-semibold text-slate-900 mb-1">Listing</legend>
        <select
          name="listingType"
          defaultValue={d.listingType ?? "sale"}
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
        >
          <option value="sale">For Sale</option>
          <option value="rent">For Rent</option>
          <option value="sold">Sold</option>
          <option value="leased">Leased</option>
          <option value="other">Other (off-market / land / development)</option>
        </select>
        <input
          name="priceDisplay"
          placeholder="Price display, e.g. $590,000 - $640,000 or Contact Agent"
          defaultValue={d.priceDisplay}
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
        />
        <div>
          <input
            name="priceValue"
            type="number"
            placeholder="Price value, e.g. 590000"
            defaultValue={d.priceValue}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
          />
          <p className="mt-1 text-xs text-slate-500">
            Not shown on the website — this is just a plain number saved for future sorting/filtering
            (e.g. &quot;sort by price&quot;). For a range, enter the lower number. Skip this for rentals — use
            Rent per week below instead.
          </p>
        </div>
        <input
          name="rentPerWeek"
          type="number"
          placeholder="Rent per week (if applicable)"
          defaultValue={d.rentPerWeek}
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
        />
        <div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="featured" defaultChecked={d.featured} />
            Feature on homepage
          </label>
          <p className="mt-1 text-xs text-slate-500">
            Shows this listing in a dedicated &quot;Featured Properties&quot; section near the top of the
            homepage, ahead of the latest-listings sections below it. Leave unchecked and the homepage
            just shows the most recent listings automatically — no need to feature anything.
          </p>
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Auction date (if any)</label>
          <DateInput name="auctionDate" defaultValue={toDateInputValue(d.auctionDate)} />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Agent</label>
          <select name="agent" defaultValue={defaultAgentId} className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white">
            <option value="">— None —</option>
            {agents.map((a) => (
              <option key={String(a._id)} value={String(a._id)}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-semibold text-slate-900 mb-1">Details</legend>
        <div className="grid grid-cols-4 gap-4">
          <input name="bedrooms" type="number" placeholder="Beds" defaultValue={d.bedrooms} className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white" />
          <input name="bathrooms" type="number" placeholder="Baths" defaultValue={d.bathrooms} className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white" />
          <input name="toilets" type="number" placeholder="Toilets" defaultValue={d.toilets} className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white" />
          <input name="carSpaces" type="number" placeholder="Car" defaultValue={d.carSpaces} className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white" />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Land size</label>
          <LandSizeInput name="landSize" defaultValue={d.landSize} />
          <p className="mt-1 text-xs text-slate-500">
            The actual block of land — leave blank for an apartment/unit with no land of its own.
          </p>
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Floor size</label>
          <LandSizeInput name="floorSize" defaultValue={d.floorSize} />
          <p className="mt-1 text-xs text-slate-500">
            Internal floor/living area — works for any property type, including apartments. A house can
            have both a land size and a floor size at once; fill in whichever apply.
          </p>
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Property Type</label>
          <select
            name="propertyType"
            defaultValue={d.propertyType ?? ""}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
          >
            <option value="">— Not set —</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <DescriptionField defaultValue={d.description} slug={d.slug} />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="font-semibold text-slate-900 mb-1">Images</legend>
        <p className="text-xs text-slate-500">
          Photos are resized and compressed in your browser before upload — S3 never stores
          the raw original.
        </p>
        <ImageUploader
          name="images"
          defaultValue={d.images}
          folder="properties"
          slug={d.slug}
          floorPlanFieldName="floorPlanImage"
          defaultFloorPlan={d.floorPlanImage}
        />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-semibold text-slate-900 mb-1">Amenities &amp; embeds</legend>
        <div>
          <label className="block text-sm text-slate-600 mb-1">
            Amenities — click to select, shown as a checklist on the listing page
          </label>
          <AmenitiesInput name="amenities" defaultValue={d.amenities} />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">
            Google Maps embed URL — optional. A map is shown automatically
            based on the address either way; only set this to use a specific
            Google Maps place instead (Maps → Share → Embed a map → copy the
            src=&quot;…&quot; URL).
          </label>
          <input
            name="mapEmbedUrl"
            placeholder="Leave blank to auto-generate from the address"
            defaultValue={d.mapEmbedUrl}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white font-mono"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">
            Video embed URL — YouTube/Vimeo &quot;Embed&quot; src, optional
          </label>
          <input
            name="videoEmbedUrl"
            placeholder="https://www.youtube.com/embed/..."
            defaultValue={d.videoEmbedUrl}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white font-mono"
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-semibold text-slate-900 mb-1">SEO (optional)</legend>
        <input
          name="seoTitle"
          placeholder="Meta title override"
          defaultValue={d.seoTitle}
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
        />
        <textarea
          name="seoDescription"
          placeholder="Meta description override"
          rows={2}
          defaultValue={d.seoDescription}
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
        />
      </fieldset>

      {isCreate && (
        <p className="text-xs text-slate-400">
          Your progress is saved automatically in this browser as you type — safe to reload or come
          back later before submitting.
        </p>
      )}

      <button type="submit" className="bg-brand-gold text-brand-navy rounded px-5 py-2.5 font-semibold hover:brightness-95 transition cursor-pointer">
        {submitLabel}
      </button>
    </form>
    </>
  );
}

export default PropertyForm;
