import { createContext, useContext } from "react";

export type JavaScriptRunReport = unknown;
export type JavaScriptRunner = (source: string, rows: Record<string, unknown>[], fileName: string) => Promise<JavaScriptRunReport>;

export const JavaScriptRuntimeContext = createContext<JavaScriptRunner>(async () => {
  throw new Error("The on-device JavaScript sandbox is not ready yet.");
});

export function useJavaScriptRuntime(): JavaScriptRunner {
  return useContext(JavaScriptRuntimeContext);
}
