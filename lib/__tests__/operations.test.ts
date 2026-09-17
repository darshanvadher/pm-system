import { describe, expect, it } from "vitest";
import { createTimeLogSchema } from "../validations/time-log";
import { createProjectFileSchema } from "../validations/project-file";

describe("Stage D Operations Validations", () => {
  it("validates time logging input schema", () => {
    const valid = createTimeLogSchema.safeParse({
      taskId: "task-123",
      hours: 4.5,
      description: "Implemented file upload API route",
    });
    expect(valid.success).toBe(true);

    const invalidHours = createTimeLogSchema.safeParse({
      taskId: "task-123",
      hours: -2,
    });
    expect(invalidHours.success).toBe(false);

    const excessHours = createTimeLogSchema.safeParse({
      taskId: "task-123",
      hours: 30,
    });
    expect(excessHours.success).toBe(false);
  });

  it("validates project file registration schema", () => {
    const valid = createProjectFileSchema.safeParse({
      projectId: "proj-nexus",
      name: "Architecture Blueprint.pdf",
      filePath: "/uploads/1234_blueprint.pdf",
      fileSize: 5242880,
      fileType: "application/pdf",
      category: "SPEC",
    });
    expect(valid.success).toBe(true);

    const invalidCategory = createProjectFileSchema.safeParse({
      projectId: "proj-nexus",
      name: "Invalid.pdf",
      filePath: "/uploads/invalid.pdf",
      fileSize: 100,
      fileType: "application/pdf",
      category: "UNKNOWN_CATEGORY" as unknown as "SPEC",
    });
    expect(invalidCategory.success).toBe(false);
  });
});
