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

export const defaultAutomations: Automation[] = [
  {
    id: "monthly-report",
    name: "Monthly Sales Report",
    description: "Summarise your regional sales and prepare a polished report.",
    category: "Reports",
    status: "active",
    schedule: "Monthly · 08:00",
    nextRun: "Sep 01, 08:00",
    totalRuns: 42,
    successRate: 100,
    lastRun: "Aug 01, 08:00",
    duration: "1 min 24 sec",
    permissions: [
      { id: "files", name: "Files access", purpose: "Read the chosen sales spreadsheet from your device.", state: "allowed" },
      { id: "excel", name: "Excel processing", purpose: "Calculate regional totals only on your device.", state: "allowed" },
      { id: "email", name: "Email", purpose: "Open an approved email draft with the report attached.", state: "needed" },
      { id: "notifications", name: "Notifications", purpose: "Tell you when the report is ready.", state: "allowed" },
    ],
    steps: [
      { id: "trigger", label: "Scheduled trigger", detail: "First day of every month at 08:00", icon: "schedule", kind: "trigger" },
      { id: "read", label: "Read sales spreadsheet", detail: "Local file: Documents/Sales.xlsx", icon: "table-chart", kind: "input" },
      { id: "calculate", label: "Calculate regional totals", detail: "Sum revenue and count completed sales", icon: "calculate", kind: "process" },
      { id: "report", label: "Generate report", detail: "Template: Monthly performance report", icon: "description", kind: "output" },
      { id: "email-step", label: "Prepare email", detail: "Recipient: sales@example.com", icon: "mail", kind: "output" },
      { id: "notify", label: "Notify when complete", detail: "Send a private local notification", icon: "notifications", kind: "notify" },
    ],
  },
  {
    id: "invoice-processor",
    name: "Invoice Processor",
    description: "Extract invoice data from PDFs and organize it for review.",
    category: "Reports",
    status: "active",
    schedule: "On demand",
    nextRun: "Ready to run",
    totalRuns: 18,
    successRate: 94,
    lastRun: "Yesterday, 16:42",
    duration: "48 sec",
    permissions: [
      { id: "files", name: "Files access", purpose: "Read selected invoice PDFs from your device.", state: "allowed" },
      { id: "excel", name: "Excel processing", purpose: "Export extracted figures to your local spreadsheet.", state: "allowed" },
      { id: "notifications", name: "Notifications", purpose: "Tell you when processing has finished.", state: "allowed" },
    ],
    steps: [
      { id: "select", label: "Choose invoice PDFs", detail: "You select files before the run begins", icon: "folder", kind: "trigger" },
      { id: "extract", label: "Extract invoice data", detail: "Read invoice number, date, and total", icon: "description", kind: "input" },
      { id: "validate", label: "Validate values", detail: "Flag missing fields for your review", icon: "calculate", kind: "process" },
      { id: "export", label: "Export to Excel", detail: "Create a local reconciliation sheet", icon: "table-chart", kind: "output" },
    ],
  },
  {
    id: "whatsapp-reminder",
    name: "WhatsApp Daily Reminder",
    description: "Prepare an approved reminder message for your daily follow-up.",
    category: "Messages",
    status: "paused",
    schedule: "Weekdays · 09:00",
    nextRun: "Paused",
    totalRuns: 12,
    successRate: 92,
    lastRun: "Aug 20, 09:00",
    duration: "10 sec",
    permissions: [
      { id: "whatsapp", name: "WhatsApp Business", purpose: "Send a message only through an approved official integration.", state: "needed" },
      { id: "notifications", name: "Notifications", purpose: "Remind you to confirm the scheduled message.", state: "allowed" },
    ],
    steps: [
      { id: "reminder-trigger", label: "Weekday schedule", detail: "Every weekday at 09:00", icon: "schedule", kind: "trigger" },
      { id: "message", label: "Build reminder message", detail: "Populate the approved template variables", icon: "chat", kind: "process" },
      { id: "send", label: "Send approved message", detail: "Official WhatsApp Business channel", icon: "chat", kind: "output" },
    ],
  },
  {
    id: "file-organizer",
    name: "File Organizer",
    description: "Rename and sort incoming reports into the correct local folders.",
    category: "Files",
    status: "active",
    schedule: "On demand",
    nextRun: "Ready to run",
    totalRuns: 9,
    successRate: 100,
    lastRun: "Aug 26, 11:15",
    duration: "16 sec",
    permissions: [
      { id: "files", name: "Files access", purpose: "Rename and organize the folders you select.", state: "allowed" },
    ],
    steps: [
      { id: "select-folder", label: "Choose folder", detail: "You choose the report folder", icon: "folder", kind: "trigger" },
      { id: "rename", label: "Rename files", detail: "Apply date and report-type naming rules", icon: "description", kind: "process" },
      { id: "move", label: "Sort into folders", detail: "Move files into selected local folders", icon: "folder", kind: "output" },
    ],
  },
  {
    id: "invoice-reminder",
    name: "Invoice Reminder",
    description: "Send a polite reminder message for overdue invoices.",
    category: "Messages",
    status: "stopped",
    schedule: "Weekly · Friday",
    nextRun: "Stopped",
    totalRuns: 6,
    successRate: 100,
    lastRun: "Jul 18, 09:00",
    duration: "8 sec",
    permissions: [
      { id: "whatsapp", name: "WhatsApp Business", purpose: "Send a message only through an approved official integration.", state: "notRequired" },
    ],
    steps: [
      { id: "reminder-check", label: "Check overdue invoices", detail: "Weekly on Fridays", icon: "schedule", kind: "trigger" },
      { id: "reminder-message", label: "Build reminder message", detail: "Populate the approved template variables", icon: "chat", kind: "process" },
    ],
  },
];

export const defaultRuns: RunRecord[] = [
  { id: "run-1", automationId: "monthly-report", automationName: "Monthly Sales Report", status: "success", timestamp: "Aug 01, 08:01", duration: "1 min 24 sec", summary: "Created regional sales summary and prepared email draft." },
  { id: "run-2", automationId: "invoice-processor", automationName: "Invoice Processor", status: "success", timestamp: "Yesterday, 16:42", duration: "48 sec", summary: "Extracted 12 invoices and saved a local reconciliation sheet." },
  { id: "run-3", automationId: "whatsapp-reminder", automationName: "WhatsApp Daily Reminder", status: "failed", timestamp: "Aug 20, 09:00", duration: "10 sec", summary: "Waiting for permission to use the approved messaging channel." },
  { id: "run-4", automationId: "file-organizer", automationName: "File Organizer", status: "success", timestamp: "Aug 26, 11:15", duration: "16 sec", summary: "Renamed and sorted six reports into local folders." },
  { id: "run-5", automationId: "monthly-report", automationName: "Send Email Report", status: "running", timestamp: "Today, 08:00", duration: "—", summary: "Preparing the monthly performance report email draft." },
  { id: "run-6", automationId: "whatsapp-reminder", automationName: "Social Media Post", status: "pending", timestamp: "Today, 10:00", duration: "—", summary: "Waiting for the scheduled time to prepare the post." },
  { id: "run-7", automationId: "file-organizer", automationName: "Website Check", status: "scheduled", timestamp: "Today, 12:00", duration: "—", summary: "Scheduled to check the monitored website for changes." },
];
