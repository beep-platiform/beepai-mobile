export type AutomationStatus = "active" | "paused" | "stopped";
export type PermissionState = "allowed" | "needed" | "notRequired";
export type RunStatus = "success" | "failed" | "running" | "pending" | "scheduled";

export type PermissionItem = {
  id: string;
  name: string;
  purpose: string;
  state: PermissionState;
};

export type WorkflowStep = {
  id: string;
  label: string;
  detail: string;
  icon: "schedule" | "table-chart" | "calculate" | "description" | "mail" | "notifications" | "folder" | "chat";
  kind: "trigger" | "input" | "process" | "output" | "notify";
};

// Real, executable workflow actions — deliberately data, not code, per the
// "automations are configuration, never hard-coded" principle. New action
// types can be added to the engine's registry without touching this shape.
export type WorkflowAction =
  | { type: "EXCEL_READ" }
  | { type: "EXCEL_SUM"; column: string }
  | { type: "EXCEL_AVERAGE"; column: string }
  | { type: "EXCEL_COUNT" }
  | { type: "MESSAGE_TEMPLATE"; template: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Validates the untrusted jsonb `configuration` column from Supabase into a
 * real, typed workflow — or undefined if it's missing/malformed, so the
 * engine never runs on a shape it can't trust.
 */
export function parseWorkflowConfiguration(configuration: unknown): WorkflowAction[] | undefined {
  if (!isRecord(configuration) || !Array.isArray(configuration.steps)) return undefined;
  const steps: WorkflowAction[] = [];
  for (const raw of configuration.steps) {
    if (!isRecord(raw) || typeof raw.type !== "string") continue;
    switch (raw.type) {
      case "EXCEL_READ":
        steps.push({ type: "EXCEL_READ" });
        break;
      case "EXCEL_COUNT":
        steps.push({ type: "EXCEL_COUNT" });
        break;
      case "EXCEL_SUM":
        if (typeof raw.column === "string" && raw.column) steps.push({ type: "EXCEL_SUM", column: raw.column });
        break;
      case "EXCEL_AVERAGE":
        if (typeof raw.column === "string" && raw.column) steps.push({ type: "EXCEL_AVERAGE", column: raw.column });
        break;
      case "MESSAGE_TEMPLATE":
        if (typeof raw.template === "string" && raw.template) steps.push({ type: "MESSAGE_TEMPLATE", template: raw.template });
        break;
      default:
        break;
    }
  }
  return steps.length ? steps : undefined;
}

export type Automation = {
  id: string;
  name: string;
  description: string;
  category: "Excel" | "Reports" | "Messages" | "Files";
  status: AutomationStatus;
  schedule: string;
  nextRun: string;
  totalRuns: number;
  successRate: number;
  lastRun: string;
  duration: string;
  permissions: PermissionItem[];
  steps: WorkflowStep[];
  source?: "local" | "delivered";
  redemptionCode?: string;
  workflow?: WorkflowAction[];
  javascriptPackageId?: string;
  packageFileName?: string;
  packageExpiresAt?: string;
  lastReport?: unknown;
};

export type RunRecord = {
  id: string;
  automationId: string;
  automationName: string;
  status: RunStatus;
  timestamp: string;
  duration: string;
  summary: string;
};

export type SubscriptionPlan = {
  id: "free" | "personal" | "professional" | "business";
  name: string;
  price: string;
  accent: string;
  summary: string;
  features: string[];
};

export const plans: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "0 RWF",
    accent: "#16A34A",
    summary: "A private start for simple tasks.",
    features: ["1 basic automation", "Up to 30 runs / month", "Offline execution"],
  },
  {
    id: "personal",
    name: "Personal",
    price: "2,000 RWF",
    accent: "#2563EB",
    summary: "More automations for individual work.",
    features: ["Up to 5 automations", "Up to 500 runs / month", "Scheduled automations"],
  },
  {
    id: "professional",
    name: "Professional",
    price: "10,000 RWF",
    accent: "#7C3AED",
    summary: "Built for productive professional teams.",
    features: ["Up to 20 automations", "Unlimited runs", "Priority support"],
  },
  {
    id: "business",
    name: "Business",
    price: "25,000 RWF",
    accent: "#F97316",
    summary: "Scale automation across your business.",
    features: ["Unlimited automations", "Multi-user workspace", "API access"],
  },
];
