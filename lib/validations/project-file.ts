import { z } from "zod";

export const FILE_CATEGORIES = [
  "SPEC",
  "CONTRACT",
  "DESIGN",
  "DOCUMENT",
  "OTHER",
] as const;

export const createProjectFileSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  name: z.string().trim().min(1, "File name is required").max(255),
  filePath: z.string().trim().min(1, "File path is required"),
  fileSize: z.number().int().positive("File size must be positive"),
  fileType: z.string().trim().min(1, "File type is required"),
  category: z.enum(FILE_CATEGORIES).default("DOCUMENT"),
});

export type CreateProjectFileInput = z.infer<typeof createProjectFileSchema>;
