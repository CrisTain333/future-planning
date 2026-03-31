import { z } from "zod";

export const createPaymentSchema = z.object({
  userId: z.string().min(1, "Member is required"),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2026),
  amount: z.number().positive("Amount must be positive"),
  penalty: z.number().min(0, "Penalty cannot be negative").default(0),
  penaltyReason: z.string().optional().or(z.literal("")),
  note: z.string().optional().or(z.literal("")),
});

export const updatePaymentSchema = z.object({
  amount: z.number().positive("Amount must be positive").optional(),
  penalty: z.number().min(0, "Penalty cannot be negative").optional(),
  penaltyReason: z.string().optional().or(z.literal("")),
  note: z.string().optional().or(z.literal("")),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
