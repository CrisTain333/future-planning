import { z } from "zod";

export const createMeetingSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional().or(z.literal("")),
  agenda: z.array(z.string().min(1)).default([]),
  date: z.string().min(1, "Date is required").refine(
    (val) => new Date(val) > new Date(),
    "Meeting date must be in the future"
  ),
  duration: z.number().int().min(15, "Minimum 15 minutes").max(480, "Maximum 8 hours"),
  type: z.enum(["regular", "special", "emergency"]).default("regular"),
  invitees: z.array(z.string().min(1)).min(1, "At least one invitee is required"),
});

export const updateMeetingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().or(z.literal("")),
  agenda: z.array(z.string()).optional(),
  date: z.string().optional(),
  duration: z.number().int().min(15).max(480).optional(),
  type: z.enum(["regular", "special", "emergency"]).optional(),
  invitees: z.array(z.string()).optional(),
});

export const attendanceSchema = z.object({
  attendance: z.array(
    z.object({
      userId: z.string().min(1),
      status: z.enum(["present", "absent", "excused"]),
    })
  ),
});

export const minutesSchema = z.object({
  mode: z.enum(["structured", "freeform"]),
  freeformContent: z.string().optional().or(z.literal("")),
  agendaItems: z.array(z.object({
    title: z.string(),
    discussion: z.string().optional().or(z.literal("")),
    decision: z.string().optional().or(z.literal("")),
  })).optional(),
  decisions: z.array(z.string()).optional(),
  actionItems: z.array(z.object({
    _id: z.string().optional(),
    title: z.string().min(1, "Title is required"),
    assignee: z.string().min(1, "Assignee is required"),
    dueDate: z.string().min(1, "Due date is required"),
    status: z.enum(["pending", "done"]).default("pending"),
  })).optional(),
  finalize: z.boolean().optional(),
});

export const actionItemUpdateSchema = z.object({
  status: z.enum(["pending", "done"]),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
export type AttendanceInput = z.infer<typeof attendanceSchema>;
export type MinutesInput = z.infer<typeof minutesSchema>;
