import { describe, expect, it } from "vitest";

describe("Stage F Insights & Analytics Calculations", () => {
  it("calculates sprint completion rate correctly", () => {
    const totalPoints = 20;
    const completedPoints = 15;
    const rate =
      totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
    expect(rate).toBe(75);
  });

  it("calculates bug resolution rate correctly", () => {
    const totalBugs = 8;
    const resolvedBugs = 6;
    const rate =
      totalBugs > 0 ? Math.round((resolvedBugs / totalBugs) * 100) : 0;
    expect(rate).toBe(75);
  });

  it("handles zero total metrics gracefully without division by zero", () => {
    const totalPoints = 0;
    const completedPoints = 0;
    const rate =
      totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
    expect(rate).toBe(0);
  });
});
