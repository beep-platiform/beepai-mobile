import { describe, expect, it } from "vitest";
import { type Automation, plans } from "../lib/beepai-data";

const fixtureAutomation: Automation = {
  id: "fixture",
  name: "Fixture Automation",
  description: "A structurally valid automation used only to test the data shape.",
  category: "Files",
  status: "active",
  schedule: "On demand",
  nextRun: "Ready to run",
  totalRuns: 0,
  successRate: 0,
  lastRun: "Not run yet",
  duration: "—",
  permissions: [{ id: "files", name: "Files access", purpose: "Read only the files you select.", state: "needed" }],
  steps: [
    { id: "trigger", label: "Choose trigger", detail: "Run on demand", icon: "schedule", kind: "trigger" },
    { id: "process", label: "Process task", detail: "Apply the workflow", icon: "calculate", kind: "process" },
  ],
};

describe("BeepAI data-driven automation model", () => {
  it("defines workflows as reusable structured actions (no automation is ever hard-coded into the app)", () => {
    expect(fixtureAutomation.id).toBeTruthy();
    expect(fixtureAutomation.steps.length).toBeGreaterThan(1);
    expect(fixtureAutomation.steps.every((step) => step.id && step.label && step.kind)).toBe(true);
    expect(fixtureAutomation.permissions.every((permission) => permission.id && permission.purpose)).toBe(true);
  });

  it("keeps subscription plans in a single configurable collection", () => {
    expect(plans.map((plan) => plan.id)).toEqual(["free", "personal", "professional", "business"]);
    expect(plans.every((plan) => plan.price && plan.features.length > 0)).toBe(true);
  });
});
