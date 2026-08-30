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


