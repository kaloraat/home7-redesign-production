import { Schema, models, model, type Document, type Model } from "mongoose";

export interface ILead extends Document {
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
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Lead: Model<ILead> = models.Lead || model<ILead>("Lead", LeadSchema);

export default Lead;
