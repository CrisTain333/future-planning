import mongoose, { Schema, Document } from "mongoose";

if (typeof process !== "undefined" && !process.emitWarning) {
  process.emitWarning = (() => {}) as typeof process.emitWarning;
}

export interface IInvestmentDocument extends Document {
  bankName: string;
  principalAmount: number;
  interestRate: number;
  compoundingFrequency: "quarterly" | "monthly" | "yearly";
  startDate: Date;
  tenureMonths: number;
  maturityDate: Date;
  maturityAmount: number;
  status: "active" | "matured" | "withdrawn";
  memberContributions: mongoose.Types.ObjectId[];
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentSchema = new Schema<IInvestmentDocument>(
  {
    bankName: { type: String, required: true },
    principalAmount: { type: Number, required: true, min: 0 },
    interestRate: { type: Number, required: true, min: 0 },
    compoundingFrequency: {
      type: String,
      enum: ["quarterly", "monthly", "yearly"],
      default: "quarterly",
    },
    startDate: { type: Date, required: true },
    tenureMonths: { type: Number, required: true, min: 1 },
    maturityDate: { type: Date, required: true },
    maturityAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["active", "matured", "withdrawn"],
      default: "active",
    },
    memberContributions: [{ type: Schema.Types.ObjectId, ref: "User" }],
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

InvestmentSchema.index({ status: 1 });
InvestmentSchema.index({ maturityDate: 1 });

const Investment =
  mongoose.models.Investment ||
  mongoose.model<IInvestmentDocument>("Investment", InvestmentSchema);
export default Investment;
