import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import * as Crypto from "expo-crypto";
import { StyleSheet, View } from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";
import { JavaScriptRuntimeContext, type JavaScriptRunReport, type JavaScriptRunner } from "@/lib/javascript-runtime-context";
import { JAVASCRIPT_RUNTIME_HOST_HTML } from "@/lib/javascript-runtime-html";

type RuntimeMessage = { type: string; id?: string; result?: string; error?: string };
type Waiter = { resolve: (value: JavaScriptRunReport) => void; reject: (error: Error) => void; timeout: ReturnType<typeof setTimeout> };

export function JavaScriptRuntimeProvider({ children }: { children: ReactNode }) {
  const webView = useRef<WebView>(null);
  const readyRef = useRef(false);
  const waiters = useRef(new Map<string, Waiter>());
  const [bootError, setBootError] = useState<string | null>(null);
  const readyPromise = useRef<{ promise: Promise<void>; resolve: () => void; reject: (error: Error) => void } | null>(null);

  if (!readyPromise.current) {
    let resolve!: () => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<void>((res, rej) => { resolve = res; reject = rej; });
    readyPromise.current = { promise, resolve, reject };
  }

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    let message: RuntimeMessage;
    try { message = JSON.parse(event.nativeEvent.data) as RuntimeMessage; }
    catch { return; }
    if (!message || typeof message.type !== "string") return;
    if (message.type === "ready") { readyRef.current = true; readyPromise.current?.resolve(); return; }
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
  }, []);

  useEffect(() => () => {
    for (const waiter of waiters.current.values()) { clearTimeout(waiter.timeout); waiter.reject(new Error("The app closed the JavaScript sandbox.")); }
    waiters.current.clear();
  }, []);

  const runJavaScript: JavaScriptRunner = useCallback(async (source, rows, fileName) => {
    if (bootError) throw new Error(bootError);
    await Promise.race([
      readyPromise.current!.promise,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("The JavaScript sandbox did not start. Reload the app and try again.")), 10000)),
    ]);
    if (!webView.current || !readyRef.current) throw new Error("The on-device JavaScript sandbox is unavailable.");
    const payload = JSON.stringify({ type: "run", id: Crypto.randomUUID(), source, rows, fileName });
    if (new TextEncoder().encode(payload).byteLength > 5_000_000) throw new Error("This spreadsheet is too large for a local run. Try a smaller sheet or fewer rows.");
    const parsed = JSON.parse(payload) as { id: string };
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        waiters.current.delete(parsed.id);
        reject(new Error("The JavaScript automation timed out. Your working file stayed on this device."));
      }, 65000);
      waiters.current.set(parsed.id, { resolve, reject, timeout });
      webView.current?.injectJavaScript(`window.__beepDispatch(${payload}); true;`);
    });
  }, [bootError]);

  return (
    <JavaScriptRuntimeContext.Provider value={runJavaScript}>
      {children}
      <View pointerEvents="none" style={styles.host}>
        <WebView
          ref={webView}
          source={{ html: JAVASCRIPT_RUNTIME_HOST_HTML }}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled={false}
          allowFileAccess={false}
          allowUniversalAccessFromFileURLs={false}
          mixedContentMode="never"
          setSupportMultipleWindows={false}
          javaScriptCanOpenWindowsAutomatically={false}
          onMessage={onMessage}
          onError={(event) => {
            const error = event.nativeEvent.description || "The local JavaScript WebView failed to load.";
            setBootError(error);
            readyPromise.current?.reject(new Error(error));
          }}
          style={styles.webView}
        />
      </View>
    </JavaScriptRuntimeContext.Provider>
  );
}

const styles = StyleSheet.create({ host: { position: "absolute", left: -2, top: -2, width: 1, height: 1, opacity: 0.01 }, webView: { flex: 1, width: 1, height: 1, backgroundColor: "transparent" } });
