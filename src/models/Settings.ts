import mongoose, { Schema, Document } from "mongoose";

export interface ISettingsDocument extends Document {
  foundationName: string;
  monthlyAmount: number;
  initialAmount: number;
  startMonth: number;
  startYear: number;
  skippedMonths: { month: number; year: number; reason?: string }[];
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
    skippedMonths: [{
      month: { type: Number, required: true },
      year: { type: Number, required: true },
      reason: { type: String },
      _id: false,
    }],
  },
  { timestamps: true }
);

const Settings =
  mongoose.models.Settings || mongoose.model<ISettingsDocument>("Settings", SettingsSchema);
export default Settings;
