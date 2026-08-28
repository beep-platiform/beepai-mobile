import { describe, expect, it } from "vitest";
import { defaultAutomations, plans } from "../lib/beepai-data";

describe("BeepAI data-driven automation model", () => {
  it("defines workflows as reusable structured actions", () => {
    expect(defaultAutomations.length).toBeGreaterThan(0);
    for (const automation of defaultAutomations) {
      expect(automation.id).toBeTruthy();
      expect(automation.steps.length).toBeGreaterThan(1);
      expect(automation.steps.every((step) => step.id && step.label && step.kind)).toBe(true);
      expect(automation.permissions.every((permission) => permission.id && permission.purpose)).toBe(true);
    }
  });

  it("keeps subscription plans in a single configurable collection", () => {
    expect(plans.map((plan) => plan.id)).toEqual(["free", "personal", "professional", "business"]);
    expect(plans.every((plan) => plan.price && plan.features.length > 0)).toBe(true);
  });
});
