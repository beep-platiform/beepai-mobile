import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as XLSX from "xlsx";
import type { WorkflowAction } from "@/lib/beepai-data";

export type EngineError = { step: string; problem: string; suggestion: string };
export type EngineResult =
  | { ok: true; summary: string; values: Record<string, string | number> }
  | { ok: false; error: EngineError };

type Row = Record<string, unknown>;

/**
 * Runs a real, data-driven workflow entirely on-device. No file ever leaves
 * the phone — parsing and calculation both happen locally.
 *
 * This deliberately does NOT use Python: Excel math doesn't need it, and
 * this Expo app can't run a Python interpreter without ejecting to custom
 * native modules. Python (pandas, Playwright, etc.) is reserved for the
 * future Desktop Agent, where actions like browser automation genuinely
 * require it.
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

function missingReadError(step: string): { ok: false; error: EngineError } {
  return { ok: false, error: { step, problem: "No spreadsheet has been read yet.", suggestion: "This automation's workflow is missing an EXCEL_READ step before this one — contact your BeepAI admin." } };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatLabel(key: string): string {
  return key.replace(/_/g, " ").toLowerCase().replace(/^./, (char) => char.toUpperCase());
}
