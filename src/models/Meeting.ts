import mongoose, { Schema, Document } from "mongoose";

if (typeof process !== "undefined" && !process.emitWarning) {
  process.emitWarning = (() => {}) as typeof process.emitWarning;
}

export interface IMeetingDocument extends Document {
  title: string;
  description: string;
  agenda: string[];
  date: Date;
  duration: number;
  type: "regular" | "special" | "emergency";
  googleEventId: string | null;
  meetLink: string | null;
  invitees: mongoose.Types.ObjectId[];
  attendance: {
    user: mongoose.Types.ObjectId;
    status: "present" | "absent" | "excused" | "not_marked";
    checkInTime: Date | null;
    markedBy: "self" | "admin";
    markedByAdmin: mongoose.Types.ObjectId | null;
  }[];
  minutes: {
    mode: "structured" | "freeform";
    freeformContent: string;
    agendaItems: {
      title: string;
      discussion: string;
      decision: string;
    }[];
    decisions: string[];
    actionItems: {
      title: string;
      assignee: mongoose.Types.ObjectId;
      dueDate: Date;
      status: "pending" | "done";
    }[];
    status: "draft" | "finalized";
    finalizedAt: Date | null;
  };
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  cancelledReason: string;
  reminderSent: {
    sentAt: Date;
    sentBy: mongoose.Types.ObjectId;
  }[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema = new Schema<IMeetingDocument>(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    agenda: [{ type: String }],
    date: { type: Date, required: true },
    duration: { type: Number, required: true, min: 15, max: 480 },
    type: {
      type: String,
      enum: ["regular", "special", "emergency"],
      default: "regular",
    },
    googleEventId: { type: String, default: null },
    meetLink: { type: String, default: null },
    invitees: [{ type: Schema.Types.ObjectId, ref: "User" }],
    attendance: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        status: {
          type: String,
          enum: ["present", "absent", "excused", "not_marked"],
          default: "not_marked",
        },
        checkInTime: { type: Date, default: null },
        markedBy: {
          type: String,
          enum: ["self", "admin"],
          default: "admin",
        },
        markedByAdmin: { type: Schema.Types.ObjectId, ref: "User", default: null },
      },
    ],
    minutes: {
      mode: {
        type: String,
        enum: ["structured", "freeform"],
        default: "structured",
      },
      freeformContent: { type: String, default: "" },
      agendaItems: [
        {
          title: { type: String },
          discussion: { type: String, default: "" },
          decision: { type: String, default: "" },
        },
      ],
      decisions: [{ type: String }],
      actionItems: [
        {
          title: { type: String, required: true },
          assignee: { type: Schema.Types.ObjectId, ref: "User", required: true },
          dueDate: { type: Date, required: true },
          status: {
            type: String,
            enum: ["pending", "done"],
            default: "pending",
          },
        },
      ],
      status: {
        type: String,
        enum: ["draft", "finalized"],
        default: "draft",
      },
      finalizedAt: { type: Date, default: null },
    },
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "cancelled"],
      default: "scheduled",
    },
    cancelledReason: { type: String, default: "" },
    reminderSent: [
      {
        sentAt: { type: Date, required: true },
        sentBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

MeetingSchema.index({ date: 1, status: 1 });
MeetingSchema.index({ "attendance.user": 1 });
MeetingSchema.index({ "minutes.actionItems.assignee": 1, "minutes.actionItems.status": 1 });
MeetingSchema.index({ createdBy: 1 });
MeetingSchema.index({ googleEventId: 1 });
MeetingSchema.index({ invitees: 1 });

const Meeting = mongoose.models.Meeting || mongoose.model<IMeetingDocument>("Meeting", MeetingSchema);
export default Meeting;
