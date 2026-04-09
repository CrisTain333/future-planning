import mongoose, { Schema, Document } from "mongoose";

if (typeof process !== "undefined" && !process.emitWarning) {
  process.emitWarning = (() => {}) as typeof process.emitWarning;
}

export interface IMessageDocument extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  type: "text" | "image" | "file" | "system";
  replyTo: mongoose.Types.ObjectId | null;
  readBy: {
    userId: mongoose.Types.ObjectId;
    readAt: Date;
  }[];
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessageDocument>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "image", "file", "system"],
      default: "text",
    },
    replyTo: { type: Schema.Types.ObjectId, ref: "Message", default: null },
    readBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        readAt: { type: Date, default: Date.now },
      },
    ],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });

const Message = mongoose.models.Message || mongoose.model<IMessageDocument>("Message", MessageSchema);
export default Message;
