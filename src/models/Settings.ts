import mongoose, { Schema, Document } from "mongoose";

export interface ISettingsDocument extends Document {
  foundationName: string;
  monthlyAmount: number;
  initialAmount: number;
  startMonth: number;
  startYear: number;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettingsDocument>(
  {
    foundationName: { type: String, default: "Future Planning" },
    monthlyAmount: { type: Number, default: 2000 },
    initialAmount: { type: Number, default: 10000 },
    startMonth: { type: Number, default: 3 },
    startYear: { type: Number, default: 2026 },
  },
  { timestamps: true }
);

const Settings =
  mongoose.models.Settings || mongoose.model<ISettingsDocument>("Settings", SettingsSchema);
export default Settings;
