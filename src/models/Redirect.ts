import { Schema, models, model, type Document, type Model } from "mongoose";

/**
 * Data-driven redirect table for anything the route structure alone can't
 * handle 1:1 — legacy mixed-case property slugs, the old site's duplicate
 * /blog/{slug} vs /{slug} URLs, or anything discovered during the pre-launch
 * diff-crawl. Keeping this in the DB (not hardcoded in middleware) means
 * whoever manages the site later can add a redirect without a deploy.
 */
export interface IRedirect extends Document {
  fromPath: string; // e.g. "/property/514A-Browns-Road-Austral-NSW-2179"
  toPath: string; // e.g. "/property/514a-browns-road-austral-nsw-2179"
  statusCode: 301 | 302;
  note?: string;
}

const RedirectSchema = new Schema<IRedirect>(
  {
    fromPath: { type: String, required: true, unique: true, index: true },
    toPath: { type: String, required: true },
    statusCode: { type: Number, enum: [301, 302], default: 301 },
    note: String,
  },
  { timestamps: true }
);

export const Redirect: Model<IRedirect> =
  models.Redirect || model<IRedirect>("Redirect", RedirectSchema);

export default Redirect;
