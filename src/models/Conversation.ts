import mongoose, { Schema, Document } from "mongoose";

if (typeof process !== "undefined" && !process.emitWarning) {
  process.emitWarning = (() => {}) as typeof process.emitWarning;
}

export interface IConversationDocument extends Document {
  type: "direct" | "group";
  name: string;
  participants: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  lastMessage: {
    content: string;
    senderId: mongoose.Types.ObjectId;
    createdAt: Date;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversationDocument>(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    name: { type: String, default: "" },
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lastMessage: {
      type: {
        content: { type: String },
        senderId: { type: Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date },
      },
      default: null,
    },
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });

const Conversation =
  mongoose.models.Conversation || mongoose.model<IConversationDocument>("Conversation", ConversationSchema);
export default Conversation;
