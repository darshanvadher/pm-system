import { describe, expect, it } from "vitest";
import {
  createSprintSchema,
  assignTaskSprintSchema,
} from "../validations/sprint";
import { createDependencySchema, createTaskSchema } from "../validations/task";

describe("Sprint & Dependency Validations", () => {
  it("validates sprint creation schema", () => {
    const valid = createSprintSchema.safeParse({
      projectId: "proj-123",
      name: "Sprint 1",
      goal: "Ship Core Agile Features",
      status: "PLANNED",
    });
    expect(valid.success).toBe(true);

    const invalid = createSprintSchema.safeParse({
      projectId: "",
      name: "",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates task sprint assignment and story points", () => {
    const valid = assignTaskSprintSchema.safeParse({
      sprintId: "sprint-1",
      storyPoints: 5,
    });
    expect(valid.success).toBe(true);

    const negativePoints = assignTaskSprintSchema.safeParse({
      storyPoints: -3,
    });
    expect(negativePoints.success).toBe(false);
  });

  it("validates task dependencies", () => {
    const valid = createDependencySchema.safeParse({
      dependsOnTaskId: "task-prev",
    });
    expect(valid.success).toBe(true);

    const invalid = createDependencySchema.safeParse({
      dependsOnTaskId: "",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates bug task type and severity", () => {
    const validBug = createTaskSchema.safeParse({
      title: "Fix Gantt Chart Dependency Line Rendering",
      projectId: "proj-1",
      type: "BUG",
      severity: "CRITICAL",
    });
    expect(validBug.success).toBe(true);
    if (validBug.success) {
      expect(validBug.data.type).toBe("BUG");
      expect(validBug.data.severity).toBe("CRITICAL");
    }
  });
});
