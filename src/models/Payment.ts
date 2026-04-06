import mongoose, { Schema, Document } from "mongoose";

if (typeof process !== "undefined" && !process.emitWarning) {
  process.emitWarning = (() => {}) as typeof process.emitWarning;
}

export interface IPaymentDocument extends Document {
  userId: mongoose.Types.ObjectId;
  month: number;
  year: number;
  amount: number;
  penalty: number;
  penaltyReason?: string;
  note?: string;
  receiptNo: string;
  status: "approved" | "deleted" | "archived";
  approvedBy: mongoose.Types.ObjectId;
  isDeleted: boolean;
  deletedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date;
  archivedBy?: mongoose.Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPaymentDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    amount: { type: Number, required: true },
    penalty: { type: Number, default: 0 },
    penaltyReason: { type: String },
    note: { type: String },
    receiptNo: { type: String, required: true, unique: true },
    status: { type: String, enum: ["approved", "deleted", "archived"], default: "approved" },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date },
    archivedBy: { type: Schema.Types.ObjectId, ref: "User" },
    archivedAt: { type: Date },
  },
  { timestamps: true }
);

PaymentSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ month: 1, year: 1 });

const Payment = mongoose.models.Payment || mongoose.model<IPaymentDocument>("Payment", PaymentSchema);
export default Payment;
