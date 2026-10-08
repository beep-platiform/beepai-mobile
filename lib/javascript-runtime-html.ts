const WORKER_SOURCE = String.raw`self.onmessage = async (event) => {
  const message = event.data;
  const noNetwork = () => { throw new Error('Network access is disabled in the automation sandbox.'); };
  for (const name of ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'Worker', 'SharedWorker', 'importScripts']) {
    try { Object.defineProperty(self, name, { value: noNetwork, writable: false, configurable: false }); } catch { self[name] = noNetwork; }
  }
  try {
    const body = message.source + "\n; if (typeof run !== 'function') throw new Error('The JavaScript file must define function run(rows, file_name).'); return run(rows, file_name);";
    const invoke = new Function('rows', 'file_name', body);
    const value = await invoke(message.rows, message.fileName);
    const result = JSON.stringify(value);
    if (typeof result !== 'string') throw new Error('The run function must return a JSON-compatible value.');
    if (result.length > 32000) throw new Error('The report is too large to display (32 KB output limit).');
    self.postMessage({ type: 'result', id: message.id, result });
  } catch (error) {
    self.postMessage({ type: 'error', id: message.id, error: error instanceof Error ? error.message : String(error) });
  }
};`;

/** Trusted bridge only. Admin JavaScript executes in a fresh Worker with no DOM or app bridge. */
export const JAVASCRIPT_RUNTIME_HOST_HTML = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob:; connect-src 'none'; img-src 'none'; style-src 'none'; font-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; worker-src blob:; form-action 'none'; base-uri 'none'">
</head><body>
<script>
const workerSource = ${JSON.stringify(WORKER_SOURCE)};
let activeWorker = null;
let activeId = null;
let runTimer = null;
function sendToApp(message) {
  const payload = JSON.stringify(message);
  if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') window.ReactNativeWebView.postMessage(payload);
  else window.parent.postMessage({ __beepRuntime: message }, '*');
}
function finish(message) {
  if (runTimer) clearTimeout(runTimer);
  runTimer = null;
  if (activeWorker) activeWorker.terminate();
  activeWorker = null;
  activeId = null;
  sendToApp(message);
}
function dispatch(message) {
  if (!message || message.type !== 'run' || typeof message.id !== 'string') return;
  if (activeWorker) { sendToApp({ type: 'error', id: message.id, error: 'Another local automation is already running.' }); return; }
  if (typeof message.source !== 'string' || message.source.length > 1048576 || !Array.isArray(message.rows) || typeof message.fileName !== 'string') {
    sendToApp({ type: 'error', id: message.id, error: 'The JavaScript package or spreadsheet input is invalid.' });
    return;
  }
  try {
    const serialized = JSON.stringify({ source: message.source, rows: message.rows, fileName: message.fileName });
    if (serialized.length > 5000000) throw new Error('This spreadsheet is too large for a local run (5 MB row-data limit).');
    const workerUrl = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
    activeWorker = new Worker(workerUrl);
    URL.revokeObjectURL(workerUrl);
    activeId = message.id;
    activeWorker.onmessage = (event) => {
      if (event.data && event.data.id === activeId && ['result', 'error'].includes(event.data.type)) finish(event.data);
    };
    activeWorker.onerror = (event) => finish({ type: 'error', id: activeId, error: event.message || 'The JavaScript automation worker failed.' });
    runTimer = setTimeout(() => finish({ type: 'error', id: activeId, error: 'The JavaScript automation took longer than 60 seconds and was stopped. Your working file stayed on this device.' }), 60000);
    activeWorker.postMessage(message);
  } catch (error) {
    finish({ type: 'error', id: message.id, error: error instanceof Error ? error.message : String(error) });
  }
}
window.__beepDispatch = dispatch;
window.addEventListener('message', (event) => {
  if (event.source === window.parent && event.data && event.data.__beepDispatch) dispatch(event.data.__beepDispatch);
});
sendToApp({ type: 'ready' });
</script></body></html>`;
