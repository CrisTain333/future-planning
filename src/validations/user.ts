import { z } from "zod";

const bloodGroupEnum = z.enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]);

export const createUserSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  username: z.string().min(1, "Username is required").toLowerCase(),
  password: z.string().min(4, "Password must be at least 4 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  bloodGroup: bloodGroupEnum.optional(),
  role: z.enum(["admin", "user"]).default("user"),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(1, "Full name is required").optional(),
  username: z.string().min(1, "Username is required").toLowerCase().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  bloodGroup: bloodGroupEnum.optional(),
  role: z.enum(["admin", "user"]).optional(),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(1, "Full name is required").optional(),
  username: z.string().min(1, "Username is required").toLowerCase().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  bloodGroup: bloodGroupEnum.optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(4, "Current password is required"),
  newPassword: z.string().min(4, "New password must be at least 4 characters"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
