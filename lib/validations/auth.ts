import { z } from "zod";

/**
 * Zod v4: string formats live as top-level functions now (z.email()
 * instead of the deprecated z.string().email()). We still want to
 * trim/lowercase BEFORE validating the email shape, so a raw z.string()
 * transform is piped into z.email() rather than chaining .email() off of
 * z.string() directly.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address")),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
