import mongoose, { Schema, Document } from "mongoose";

if (typeof process !== "undefined" && !process.emitWarning) {
  process.emitWarning = (() => {}) as typeof process.emitWarning;
}

export interface IPresenceDocument extends Document {
  userId: mongoose.Types.ObjectId;
  status: "online" | "offline";
  lastSeen: Date;
  isTyping: {
    conversationId: mongoose.Types.ObjectId;
    since: Date;
  } | null;
}

const PresenceSchema = new Schema<IPresenceDocument>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  status: {
    type: String,
    enum: ["online", "offline"],
    default: "offline",
  },
  lastSeen: { type: Date, default: Date.now },
  isTyping: {
    type: {
      conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
      since: { type: Date },
    },
    default: null,
  },
});

PresenceSchema.index({ userId: 1 }, { unique: true });
PresenceSchema.index({ status: 1 });

const Presence = mongoose.models.Presence || mongoose.model<IPresenceDocument>("Presence", PresenceSchema);
export default Presence;
