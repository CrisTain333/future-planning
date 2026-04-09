import { z } from "zod";

export const createConversationSchema = z.object({
  type: z.enum(["direct", "group"]),
  name: z.string().max(100).optional().or(z.literal("")),
  participants: z.array(z.string().min(1)).min(1, "At least one participant is required"),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(5000),
  type: z.enum(["text", "image", "file"]).default("text"),
  replyTo: z.string().optional(),
});

export const updateConversationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  addParticipants: z.array(z.string()).optional(),
  removeParticipants: z.array(z.string()).optional(),
});

export const heartbeatSchema = z.object({
  typing: z
    .object({
      conversationId: z.string().min(1),
      isTyping: z.boolean(),
    })
    .optional(),
});

export const initiateCallSchema = z.object({
  conversationId: z.string().min(1, "Conversation is required"),
  type: z.enum(["audio", "video"]),
});

export const updateCallSchema = z.object({
  status: z.enum(["active", "ended", "missed"]),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
export type HeartbeatInput = z.infer<typeof heartbeatSchema>;
export type InitiateCallInput = z.infer<typeof initiateCallSchema>;
export type UpdateCallInput = z.infer<typeof updateCallSchema>;
