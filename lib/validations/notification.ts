import { z } from "zod";

export const NOTIFICATION_TYPES = [
  "TASK_ASSIGNED",
  "STATUS_CHANGED",
  "COMMENT_ADDED",
  "CLIENT_UPDATE",
  "SYSTEM",
] as const;

export const createNotificationSchema = z.object({
  userId: z.string().min(1, "Recipient user is required"),
  title: z.string().trim().min(1, "Title is required").max(200),
  message: z.string().trim().min(1, "Message is required").max(1000),
  type: z.enum(NOTIFICATION_TYPES).default("SYSTEM"),
  link: z.string().optional().or(z.literal("")),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
