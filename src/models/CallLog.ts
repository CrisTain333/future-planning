import mongoose, { Schema, Document } from "mongoose";

if (typeof process !== "undefined" && !process.emitWarning) {
  process.emitWarning = (() => {}) as typeof process.emitWarning;
}

export interface ICallLogDocument extends Document {
  conversationId: mongoose.Types.ObjectId;
  initiatedBy: mongoose.Types.ObjectId;
  participants: {
    userId: mongoose.Types.ObjectId;
    joinedAt: Date | null;
    leftAt: Date | null;
  }[];
  type: "audio" | "video";
  status: "ringing" | "active" | "ended" | "missed";
  startedAt: Date | null;
  endedAt: Date | null;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

const CallLogSchema = new Schema<ICallLogDocument>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    initiatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    participants: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        joinedAt: { type: Date, default: null },
        leftAt: { type: Date, default: null },
      },
    ],
    type: {
      type: String,
      enum: ["audio", "video"],
      required: true,
    },
    status: {
      type: String,
      enum: ["ringing", "active", "ended", "missed"],
      default: "ringing",
    },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    duration: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CallLogSchema.index({ conversationId: 1 });
CallLogSchema.index({ initiatedBy: 1 });
CallLogSchema.index({ status: 1 });

const CallLog = mongoose.models.CallLog || mongoose.model<ICallLogDocument>("CallLog", CallLogSchema);
export default CallLog;
