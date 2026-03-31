import { z } from "zod";

export const createNoticeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
});

export const updateNoticeSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  body: z.string().min(1, "Body is required").optional(),
});

export type CreateNoticeInput = z.infer<typeof createNoticeSchema>;
export type UpdateNoticeInput = z.infer<typeof updateNoticeSchema>;
