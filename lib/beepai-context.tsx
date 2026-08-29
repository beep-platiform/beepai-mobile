import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Automation, defaultAutomations, defaultRuns, plans, type PermissionState, type RunRecord } from "@/lib/beepai-data";

type NewAutomation = { description: string; tools: string[]; frequency: string };

type BeepAIContextValue = {
  automations: Automation[];
  runs: RunRecord[];
  currentPlanId: string;
  runningIds: string[];
  createAutomation: (request: NewAutomation) => string;
  addDeliveredAutomation: (pkg: { id: string; name: string; description: string; schedule: string; redemptionCode: string }) => "added" | "duplicate";
  runAutomation: (id: string) => void;
  toggleAutomation: (id: string) => void;
  setPermission: (automationId: string, permissionId: string, state: PermissionState) => void;
  selectPlan: (id: string) => void;
  resetWorkspace: () => void;
};

const BeepAIContext = createContext<BeepAIContextValue | undefined>(undefined);

export function BeepAIProvider({ children }: { children: ReactNode }) {
  const [automations, setAutomations] = useState(defaultAutomations);
  const [runs, setRuns] = useState(defaultRuns);
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

  const addDeliveredAutomation = (pkg: { id: string; name: string; description: string; schedule: string; redemptionCode: string }): "added" | "duplicate" => {
    let outcome: "added" | "duplicate" = "added";
    setAutomations((items) => {
      if (items.some((item) => item.redemptionCode === pkg.redemptionCode)) {
        outcome = "duplicate";
        return items;
      }
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
        permissions: [
          { id: "files", name: "Files access", purpose: "Read only the files you select for this automation.", state: "needed" },
          { id: "notifications", name: "Notifications", purpose: "Tell you when a run finishes or needs attention.", state: "allowed" },
        ],
        steps: [
          { id: "delivered-trigger", label: "Package delivered", detail: "Built and signed off by your BeepAI admin", icon: "schedule", kind: "trigger" },
          { id: "delivered-process", label: "Run your workflow", detail: "Processes your files locally on this device", icon: "calculate", kind: "process" },
          { id: "delivered-notify", label: "Notify you", detail: "Show a local result notification", icon: "notifications", kind: "notify" },
        ],
      };
      return [automation, ...items];
    });
    return outcome;
  };

  const runAutomation = (id: string) => {
    const automation = automations.find((item) => item.id === id);
    if (!automation || runningIds.includes(id)) return;
    setRunningIds((items) => [...items, id]);
    setTimeout(() => {
      const completedAt = "Just now";
      setRunningIds((items) => items.filter((item) => item !== id));
      setAutomations((items) => items.map((item) => item.id === id ? { ...item, totalRuns: item.totalRuns + 1, lastRun: completedAt, duration: "18 sec", successRate: item.successRate === 0 ? 100 : item.successRate } : item));
      setRuns((items) => [{ id: `run-${Date.now()}`, automationId: automation.id, automationName: automation.name, status: "success", timestamp: completedAt, duration: "18 sec", summary: "Completed locally. Your data remains on this device." }, ...items]);
    }, 900);
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
    setAutomations(defaultAutomations);
    setRuns(defaultRuns);
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
