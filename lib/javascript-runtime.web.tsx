import { createElement, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { JavaScriptRuntimeContext, type JavaScriptRunReport, type JavaScriptRunner } from "@/lib/javascript-runtime-context";
import { JAVASCRIPT_RUNTIME_HOST_HTML } from "@/lib/javascript-runtime-html";

type RuntimeMessage = { type: string; id?: string; result?: string; error?: string };
type Waiter = { resolve: (value: JavaScriptRunReport) => void; reject: (error: Error) => void; timeout: ReturnType<typeof setTimeout> };

export function JavaScriptRuntimeProvider({ children }: { children: ReactNode }) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const waiters = useRef(new Map<string, Waiter>());
  const readyPromise = useRef<{ promise: Promise<void>; resolve: () => void; reject: (error: Error) => void } | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);

  if (!readyPromise.current) {
    let resolve!: () => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<void>((res, rej) => { resolve = res; reject = rej; });
    readyPromise.current = { promise, resolve, reject };
  }

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      const message = (event.data as { __beepRuntime?: RuntimeMessage })?.__beepRuntime;
      if (!message || typeof message.type !== "string") return;
      if (message.type === "ready") { readyPromise.current?.resolve(); return; }
      if (message.type === "bootError") {
        const error = new Error(message.error || "The JavaScript sandbox could not start.");
        setBootError(error.message);
        readyPromise.current?.reject(error);
        for (const waiter of waiters.current.values()) { clearTimeout(waiter.timeout); waiter.reject(error); }
        waiters.current.clear();
        return;
      }
      if (!message.id || !["result", "error"].includes(message.type)) return;
      const waiter = waiters.current.get(message.id);
      if (!waiter) return;
      clearTimeout(waiter.timeout);
      waiters.current.delete(message.id);
      if (message.type === "error") { waiter.reject(new Error(message.error || "The JavaScript automation failed.")); return; }
      try { waiter.resolve(JSON.parse(message.result ?? "null")); }
      catch { waiter.reject(new Error("The JavaScript automation returned an unreadable report.")); }
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      for (const waiter of waiters.current.values()) { clearTimeout(waiter.timeout); waiter.reject(new Error("The app closed the JavaScript sandbox.")); }
      waiters.current.clear();
    };
  }, []);

  const runJavaScript: JavaScriptRunner = useCallback(async (source, rows, fileName) => {
    if (bootError) throw new Error(bootError);
    await Promise.race([
      readyPromise.current!.promise,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("The JavaScript sandbox did not start. Reload the app and try again.")), 10000)),
    ]);
    const frame = frameRef.current;
    if (!frame?.contentWindow) throw new Error("The on-device JavaScript sandbox is unavailable.");
    const payload = { type: "run", id: crypto.randomUUID(), source, rows, fileName };
    if (new TextEncoder().encode(JSON.stringify(payload)).byteLength > 5_000_000) throw new Error("This spreadsheet is too large for a local run. Try a smaller sheet or fewer rows.");
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        waiters.current.delete(payload.id);
        reject(new Error("The JavaScript automation timed out. Your working file stayed on this device."));
      }, 65000);
      waiters.current.set(payload.id, { resolve, reject, timeout });
      frame.contentWindow?.postMessage({ __beepDispatch: payload }, "*");
    });
  }, [bootError]);

  const frame = createElement("iframe", {
    ref: frameRef,
    title: "Isolated local JavaScript automation sandbox",
    // This same-origin iframe hosts only the trusted bridge; uploaded admin
    // code executes inside the separate network-restricted Worker it creates.
    srcDoc: JAVASCRIPT_RUNTIME_HOST_HTML,
    "aria-hidden": true,
    style: { position: "absolute", left: -2, top: -2, width: 1, height: 1, opacity: 0, pointerEvents: "none" },
  });

  return <JavaScriptRuntimeContext.Provider value={runJavaScript}>{children}{frame}</JavaScriptRuntimeContext.Provider>;
}
