import { z } from "zod";
import { ROLE_NAMES, type RoleName } from "@/lib/auth/permissions";

// ROLE_NAMES is the single source of truth for which roles exist; this
// just reshapes it into the tuple form z.enum() requires.
const ROLE_NAME_VALUES = Object.values(ROLE_NAMES) as [RoleName, ...RoleName[]];
export const roleNameSchema = z.enum(ROLE_NAME_VALUES);

export const createUserSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address")),
  name: z.string().trim().min(1, "Name is required").max(200),
  password: z.string().min(8, "Password must be at least 8 characters"),
  roleName: roleNameSchema,
});

// Everything optional: a PATCH may touch just one field (e.g. only
// isActive, from a "deactivate" button that doesn't resend name/role).
export const updateUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200).optional(),
  roleName: roleNameSchema.optional(),
  isActive: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
