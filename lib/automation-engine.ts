import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as XLSX from "xlsx";
import type { WorkflowAction } from "@/lib/beepai-data";
import type { JavaScriptRunner } from "@/lib/javascript-runtime-context";

export type EngineError = { step: string; problem: string; suggestion: string };
export type EngineResult =
  | { ok: true; summary: string; values: Record<string, string | number>; report?: unknown }
  | { ok: false; error: EngineError };

type Row = Record<string, unknown>;

/**
 * Runs a real, data-driven workflow entirely on-device. No file ever leaves
 * the phone — parsing and calculation both happen locally.
 *
 * Admin-delivered JavaScript packages use the device's restricted local
 * JavaScript sandbox; only Excel/CSV workbooks are currently supported inputs.
 */
export async function runWorkflow(workflow: WorkflowAction[]): Promise<EngineResult> {
  const values: Record<string, string | number> = {};
  let rows: Row[] | null = null;

  for (const action of workflow) {
    switch (action.type) {
      case "EXCEL_READ": {
        const picked = await DocumentPicker.getDocumentAsync({
          multiple: false,
          type: [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
            "text/csv",
          ],
        });
        if (picked.canceled || !picked.assets?.[0]) {
          return { ok: false, error: { step: "EXCEL_READ", problem: "No file was selected.", suggestion: "Choose an Excel (.xlsx) or CSV file to run this automation." } };
        }
        try {
          const base64 = await FileSystem.readAsStringAsync(picked.assets[0].uri, { encoding: FileSystem.EncodingType.Base64 });
          const workbook = XLSX.read(base64, { type: "base64" });
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) {
            return { ok: false, error: { step: "EXCEL_READ", problem: "The file has no sheets.", suggestion: "Check the file and try again." } };
          }
          rows = XLSX.utils.sheet_to_json<Row>(workbook.Sheets[sheetName], { defval: null });
        } catch {
          return { ok: false, error: { step: "EXCEL_READ", problem: "BeepAI couldn't read that file.", suggestion: "Make sure it's a valid Excel or CSV file, not corrupted or password-protected." } };
        }
        if (!rows.length) {
          return { ok: false, error: { step: "EXCEL_READ", problem: "The selected file has no data rows.", suggestion: "Check the file contains data below the header row." } };
        }
        values.EXCEL_ROW_COUNT = rows.length;
        break;
      }

      case "EXCEL_COUNT": {
        if (!rows) return missingReadError("EXCEL_COUNT");
        values.EXCEL_COUNT = rows.length;
        break;
      }

      case "EXCEL_SUM":
      case "EXCEL_AVERAGE": {
        if (!rows) return missingReadError(action.type);
        if (!(action.column in rows[0])) {
          return { ok: false, error: { step: action.type, problem: `Required column "${action.column}" was not found.`, suggestion: `Make sure your file contains a column named "${action.column}".` } };
        }
        const numbers = rows.map((row) => Number(row[action.column])).filter((value) => !Number.isNaN(value));
        if (!numbers.length) {
          return { ok: false, error: { step: action.type, problem: `Column "${action.column}" has no numeric values.`, suggestion: `Check that "${action.column}" contains numbers, not text.` } };
        }
        const total = numbers.reduce((sum, value) => sum + value, 0);
        values[action.type] = action.type === "EXCEL_SUM" ? round(total) : round(total / numbers.length);
        break;
      }

      case "MESSAGE_TEMPLATE": {
        let text = action.template;
        for (const [key, value] of Object.entries(values)) {
          text = text.split(`{${key}}`).join(String(value));
        }
        values.MESSAGE = text;
        break;
      }

      default:
        break;
    }
  }

  const summary = typeof values.MESSAGE === "string" ? values.MESSAGE : Object.entries(values).map(([key, value]) => `${formatLabel(key)}: ${value}`).join(" · ");
  return { ok: true, summary: summary || "Completed with no output values.", values };
}

/**
 * Executes an admin-delivered JavaScript module locally. The user picks their
 * working file, JavaScript parses only the first sheet into rows, and those
 * rows plus the decrypted module are passed to the network-restricted sandbox.
 */
export async function runJavaScriptAutomation(source: string, runJavaScript: JavaScriptRunner): Promise<EngineResult> {
  const picked = await DocumentPicker.getDocumentAsync({
    multiple: false,
    copyToCacheDirectory: true,
    type: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "text/csv"],
  });
  if (picked.canceled || !picked.assets?.[0]) {
    return { ok: false, error: { step: "CHOOSE_FILE", problem: "No file was selected.", suggestion: "Choose an Excel (.xlsx) or CSV file to run this automation." } };
  }
  const asset = picked.assets[0];
  try {
    const workbook = asset.file
      ? XLSX.read(await asset.file.arrayBuffer(), { type: "array" })
      : XLSX.read(await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 }), { type: "base64" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return { ok: false, error: { step: "READ_FILE", problem: "The selected workbook contains no sheets.", suggestion: "Select a valid Excel workbook or CSV file." } };
    const rows = XLSX.utils.sheet_to_json<Row>(workbook.Sheets[sheetName], { defval: null });
    if (!rows.length) return { ok: false, error: { step: "READ_FILE", problem: "The selected file contains no data rows.", suggestion: "Add data below the header row and try again." } };
    const report = await runJavaScript(source, rows, asset.name);
    const summary = typeof report === "string" ? report : JSON.stringify(report, null, 2);
    return { ok: true, summary: summary || "The JavaScript automation completed.", values: { JAVASCRIPT_REPORT: summary || "Completed" }, report };
  } catch (cause) {
    return { ok: false, error: { step: "JAVASCRIPT_RUN", problem: cause instanceof Error ? cause.message : "The JavaScript automation failed.", suggestion: "The .js file must define `function run(rows, file_name)` and return a JSON-compatible value. Network access is disabled, and your working file stayed on this device." } };
  }
}

function missingReadError(step: string): { ok: false; error: EngineError } {
  return { ok: false, error: { step, problem: "No spreadsheet has been read yet.", suggestion: "This automation's workflow is missing an EXCEL_READ step before this one — contact your BeepAI admin." } };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatLabel(key: string): string {
  return key.replace(/_/g, " ").toLowerCase().replace(/^./, (char) => char.toUpperCase());
}
