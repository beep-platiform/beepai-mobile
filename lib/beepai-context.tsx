import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Alert } from "react-native";
import { runJavaScriptAutomation, runWorkflow } from "@/lib/automation-engine";
import { Automation, parseWorkflowConfiguration, type PermissionState, plans, type RunRecord } from "@/lib/beepai-data";
import { loadAutomationPackage } from "@/lib/secure-automation-packages";
import { useJavaScriptRuntime } from "@/lib/javascript-runtime-context";

type NewAutomation = { description: string; tools: string[]; frequency: string };

type BeepAIContextValue = {
  automations: Automation[];
  runs: RunRecord[];
  currentPlanId: string;
  runningIds: string[];
  createAutomation: (request: NewAutomation) => string;
  addDeliveredAutomation: (pkg: { id: string; name: string; description: string; schedule: string; redemptionCode: string; configuration?: unknown; packageFileName: string; packageExpiresAt: string; javascriptPackageId: string }) => "added" | "duplicate";
  runAutomation: (id: string) => Promise<void>;
  toggleAutomation: (id: string) => void;
  setPermission: (automationId: string, permissionId: string, state: PermissionState) => void;
  selectPlan: (id: string) => void;
  resetWorkspace: () => void;
};

const BeepAIContext = createContext<BeepAIContextValue | undefined>(undefined);

export function BeepAIProvider({ children }: { children: ReactNode }) {
  const javascriptRunner = useJavaScriptRuntime();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState("personal");
  const [runningIds, setRunningIds] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        const raw = await AsyncStorage.getItem("@beepai-workspace-v1");
        if (raw) {
          const saved = JSON.parse(raw) as { automations?: Automation[]; runs?: RunRecord[]; currentPlanId?: string };
          if (saved.automations) setAutomations(saved.automations);
          if (saved.runs) setRuns(saved.runs);
          if (saved.currentPlanId) setCurrentPlanId(saved.currentPlanId);
        }
      } catch {
        // The default local workspace remains available if stored data cannot be read.
      } finally {
        setIsHydrated(true);
      }
    };
    loadWorkspace();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem("@beepai-workspace-v1", JSON.stringify({ automations, runs, currentPlanId })).catch(() => undefined);
  }, [automations, currentPlanId, isHydrated, runs]);

  const createAutomation = (request: NewAutomation) => {
    const id = `request-${Date.now()}`;
    const primaryTool = request.tools[0] ?? "Files";
    const name = request.description.trim().slice(0, 38) || "New Automation";
    const automation: Automation = {
      id,
      name,
      description: request.description || "A new BeepAI automation request.",
      category: primaryTool === "Messages" ? "Messages" : primaryTool === "Files" ? "Files" : "Excel",
      status: "active",
      schedule: request.frequency === "On demand" ? "On demand" : `${request.frequency} schedule`,
      nextRun: "Ready to configure",
      totalRuns: 0,
      successRate: 0,
      lastRun: "Not run yet",
      duration: "—",
      permissions: [
        { id: "files", name: "Files access", purpose: "Read only the files you select for this automation.", state: "needed" },
        { id: "notifications", name: "Notifications", purpose: "Tell you when a run finishes or needs attention.", state: "allowed" },
      ],
      steps: [
        { id: "new-trigger", label: "Choose trigger", detail: request.frequency === "On demand" ? "Run whenever you choose" : `${request.frequency} schedule`, icon: "schedule", kind: "trigger" },
        { id: "new-input", label: `Read ${primaryTool} input`, detail: "Use data you approve on this device", icon: primaryTool === "Files" ? "folder" : "table-chart", kind: "input" },
        { id: "new-process", label: "Process task", detail: "Apply the workflow after your review", icon: "calculate", kind: "process" },
        { id: "new-notify", label: "Notify you", detail: "Show a local result notification", icon: "notifications", kind: "notify" },
      ],
    };
    setAutomations((items) => [automation, ...items]);
    return id;
  };

  const addDeliveredAutomation = (pkg: { id: string; name: string; description: string; schedule: string; redemptionCode: string; configuration?: unknown; packageFileName: string; packageExpiresAt: string; javascriptPackageId: string }): "added" | "duplicate" => {
    let outcome: "added" | "duplicate" = "added";
    setAutomations((items) => {
      if (items.some((item) => item.redemptionCode === pkg.redemptionCode)) {
        outcome = "duplicate";
        return items;
      }
      const workflow = parseWorkflowConfiguration(pkg.configuration);
      const automation: Automation = {
        id: `delivered-${pkg.id}`,
        name: pkg.name,
        description: pkg.description || "Delivered by your BeepAI admin.",
        category: "Reports",
        status: "active",
        schedule: pkg.schedule || "On demand",
        nextRun: "Ready to run",
        totalRuns: 0,
        successRate: 0,
        lastRun: "Not run yet",
        duration: "—",
        source: "delivered",
        redemptionCode: pkg.redemptionCode,
        workflow,
        javascriptPackageId: pkg.javascriptPackageId,
        packageFileName: pkg.packageFileName,
        packageExpiresAt: pkg.packageExpiresAt,
        permissions: [
          { id: "files", name: "Files access", purpose: "Read only the files you select for this automation.", state: "needed" },
          { id: "notifications", name: "Notifications", purpose: "Tell you when a run finishes or needs attention.", state: "allowed" },
        ],
        steps: [
          { id: "delivered-trigger", label: "Package delivered", detail: "Built and signed off by your BeepAI admin", icon: "schedule", kind: "trigger" },
          { id: "delivered-process", label: "Run your workflow", detail: pkg.javascriptPackageId ? "Runs the downloaded JavaScript package on a file you choose on this device" : workflow ? "Processes your files locally on this device" : "Not yet configured by your admin", icon: "calculate", kind: "process" },
          { id: "delivered-notify", label: "Notify you", detail: "Show a local result notification", icon: "notifications", kind: "notify" },
        ],
      };
      return [automation, ...items];
    });
    return outcome;
  };

  const runAutomation = async (id: string) => {
    const automation = automations.find((item) => item.id === id);
    if (!automation || runningIds.includes(id)) return;
    setRunningIds((items) => [...items, id]);
    const completedAt = "Just now";
    try {
      if (!automation.javascriptPackageId && (!automation.workflow || !automation.workflow.length)) {
        Alert.alert("Not ready to run yet", `${automation.name} hasn't been configured with a runnable workflow yet. Contact your BeepAI admin to finish setting it up.`);
        setRuns((items) => [{ id: `run-${Date.now()}`, automationId: automation.id, automationName: automation.name, status: "failed", timestamp: completedAt, duration: "—", summary: "No workflow has been configured for this automation yet." }, ...items]);
        return;
      }
      const result = automation.javascriptPackageId
        ? await runJavaScriptAutomation(await loadAutomationPackage(automation.javascriptPackageId), javascriptRunner)
        : await runWorkflow(automation.workflow ?? []);
      if (result.ok) {
        Alert.alert(`${automation.name} completed`, "Your local report is ready below.");
        setAutomations((items) => items.map((item) => {
          if (item.id !== id) return item;
          const nextTotal = item.totalRuns + 1;
          const priorSuccesses = Math.round((item.successRate / 100) * item.totalRuns);
          return { ...item, totalRuns: nextTotal, lastRun: completedAt, duration: "Just now", successRate: Math.round(((priorSuccesses + 1) / nextTotal) * 100), lastReport: result.report ?? { summary: result.summary } };
        }));
        setRuns((items) => [{ id: `run-${Date.now()}`, automationId: automation.id, automationName: automation.name, status: "success", timestamp: completedAt, duration: "Just now", summary: result.summary }, ...items]);
      } else {
        Alert.alert("Automation failed", `Step: ${result.error.step}\n\n${result.error.problem}\n\n${result.error.suggestion}`);
        setAutomations((items) => items.map((item) => {
          if (item.id !== id) return item;
          const nextTotal = item.totalRuns + 1;
          const priorSuccesses = Math.round((item.successRate / 100) * item.totalRuns);
          return { ...item, totalRuns: nextTotal, lastRun: completedAt, successRate: Math.round((priorSuccesses / nextTotal) * 100) };
        }));
        setRuns((items) => [{ id: `run-${Date.now()}`, automationId: automation.id, automationName: automation.name, status: "failed", timestamp: completedAt, duration: "—", summary: `${result.error.problem} ${result.error.suggestion}` }, ...items]);
      }
    } catch (cause) {
      const problem = cause instanceof Error ? cause.message : "The automation could not run.";
      Alert.alert("Automation failed", problem);
      setRuns((items) => [{ id: `run-${Date.now()}`, automationId: automation.id, automationName: automation.name, status: "failed", timestamp: completedAt, duration: "—", summary: problem }, ...items]);
    } finally {
      setRunningIds((items) => items.filter((item) => item !== id));
    }
  };

  const toggleAutomation = (id: string) => {
    setAutomations((items) => items.map((item) => {
      if (item.id !== id) return item;
      const next = item.status === "active" ? "paused" : "active";
      return { ...item, status: next, nextRun: next === "active" ? (item.schedule === "On demand" ? "Ready to run" : "Scheduled") : "Paused" };
    }));
  };

  const setPermission = (automationId: string, permissionId: string, state: PermissionState) => {
    setAutomations((items) => items.map((item) => item.id === automationId ? { ...item, permissions: item.permissions.map((permission) => permission.id === permissionId ? { ...permission, state } : permission) } : item));
  };

  const resetWorkspace = () => {
    setAutomations([]);
    setRuns([]);
    setCurrentPlanId("personal");
    AsyncStorage.removeItem("@beepai-workspace-v1").catch(() => undefined);
  };

  const value = useMemo(() => ({ automations, runs, currentPlanId, runningIds, createAutomation, addDeliveredAutomation, runAutomation, toggleAutomation, setPermission, selectPlan: setCurrentPlanId, resetWorkspace }), [automations, runs, currentPlanId, runningIds]);
  return <BeepAIContext.Provider value={value}>{children}</BeepAIContext.Provider>;
}

export function useBeepAI() {
  const context = useContext(BeepAIContext);
  if (!context) throw new Error("useBeepAI must be used inside BeepAIProvider");
  return context;
}

export function getPlan(id: string) {
  return plans.find((plan) => plan.id === id) ?? plans[0];
}
