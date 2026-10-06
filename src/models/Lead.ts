import { Schema, models, model, type Document, type Model } from "mongoose";

/** Google Ads click ids + UTMs saved with each lead, for offline conversion uploads. */
export const ATTRIBUTION_FIELDS = [
  "gclid", "gbraid", "wbraid",
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "landing_url", "referrer",
] as const;
export type AttributionField = (typeof ATTRIBUTION_FIELDS)[number];

export interface ILead extends Document, Partial<Record<AttributionField, string>> {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  type: "selling" | "renting" | "buying" | "tenant-application" | "general-contact" | "blog";
  suburb?: string;
  property?: Schema.Types.ObjectId;
  status: "new" | "contacted" | "closed";
  createdAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    message: String,
    type: {
      type: String,
      enum: ["selling", "renting", "buying", "tenant-application", "general-contact", "blog"],
      required: true,
      index: true,
    },
    suburb: String,
    property: { type: Schema.Types.ObjectId, ref: "Property" },
    status: { type: String, enum: ["new", "contacted", "closed"], default: "new" },
    ...Object.fromEntries(ATTRIBUTION_FIELDS.map((k) => [k, String])),
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Lead: Model<ILead> = models.Lead || model<ILead>("Lead", LeadSchema);

export default Lead;
