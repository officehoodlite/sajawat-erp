import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .min(2, "Username is required")
  .max(64)
  .regex(/^[a-zA-Z0-9._-]+$/, "Username may contain letters, numbers, dots, underscores, and hyphens");

const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(256);

export const createUserSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  role: z.enum(["ADMIN", "USER"]).default("USER"),
  workerPrices: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const updateUserSchema = z
  .object({
    username: usernameSchema.optional(),
    password: passwordSchema.optional(),
    role: z.enum(["ADMIN", "USER"]).optional(),
    workerPrices: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
