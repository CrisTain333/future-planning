import mongoose, { Schema, Document } from "mongoose";

if (typeof process !== "undefined" && !process.emitWarning) {
  process.emitWarning = (() => {}) as typeof process.emitWarning;
}

export interface IPushSubscriptionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceName: string;
  createdAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscriptionDocument>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  endpoint: { type: String, required: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  deviceName: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

PushSubscriptionSchema.index({ userId: 1 });

const PushSubscription =
  mongoose.models.PushSubscription ||
  mongoose.model<IPushSubscriptionDocument>("PushSubscription", PushSubscriptionSchema);
export default PushSubscription;
