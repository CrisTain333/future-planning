import mongoose, { Schema, Document } from "mongoose";

if (typeof process !== "undefined" && !process.emitWarning) {
  process.emitWarning = (() => {}) as typeof process.emitWarning;
}

export interface INoticeDocument extends Document {
  title: string;
  body: string;
  createdBy: mongoose.Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NoticeSchema = new Schema<INoticeDocument>(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NoticeSchema.index({ createdAt: -1 });

const Notice = mongoose.models.Notice || mongoose.model<INoticeDocument>("Notice", NoticeSchema);
export default Notice;
