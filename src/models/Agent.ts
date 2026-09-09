import { Schema, models, model, type Document, type Model } from "mongoose";

export interface IAgent extends Document {
  slug: string;
  name: string;
  role: string;
  phone?: string;
  mobile?: string;
  whatsapp?: string;
  email?: string;
  photo?: string;
  facebook?: string;
  linkedin?: string;
  bio?: string;
  order: number;
  active: boolean;
}

const AgentSchema = new Schema<IAgent>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    phone: String,
    mobile: String,
    whatsapp: String,
    email: String,
    photo: String,
    facebook: String,
    linkedin: String,
    bio: String,
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Agent: Model<IAgent> = models.Agent || model<IAgent>("Agent", AgentSchema);

export default Agent;
