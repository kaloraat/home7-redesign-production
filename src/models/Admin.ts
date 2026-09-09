import { Schema, models, model, type Document, type Model } from "mongoose";

export interface IAdmin extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: "owner" | "editor";
}

const AdminSchema = new Schema<IAdmin>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["owner", "editor"], default: "editor" },
  },
  { timestamps: true }
);

export const Admin: Model<IAdmin> = models.Admin || model<IAdmin>("Admin", AdminSchema);

export default Admin;
