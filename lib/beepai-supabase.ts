import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import * as DocumentPicker from "expo-document-picker";
import { createClient } from "@supabase/supabase-js";

const extra = (Constants.expoConfig?.extra ?? {}) as { supabaseUrl?: string; supabaseAnonKey?: string };
const url = extra.supabaseUrl;
const anonKey = extra.supabaseAnonKey;
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export type AutomationRequestInput = {
  description: string;
  involvedTools: string[];
  frequency: string;
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  sampleFile?: DocumentPicker.DocumentPickerAsset | null;
};

export type SubmitResult = { ok: true; requestId: string } | { ok: false; error: string };

const SAMPLE_BUCKET = "beepai-request-samples";
const MAX_SAMPLE_BYTES = 10 * 1024 * 1024;
const fileTypes: Record<string, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  csv: "text/csv",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
};

async function getUploadBody(asset: DocumentPicker.DocumentPickerAsset): Promise<File | ArrayBuffer> {
  if (asset.file) return asset.file;
  const response = await fetch(asset.uri);
  if (!response.ok) throw new Error("The selected sample file could not be read on this device.");
  return response.arrayBuffer();
}

/**
 * Stores request metadata in the existing Supabase request table and, when the
 * customer explicitly attaches a sample, uploads it to a private Storage bucket
 * so only an authorized Beep admin can open it. The separate working file used
 * when an automation runs is still processed locally by the app.
 */
export async function submitAutomationRequest(input: AutomationRequestInput): Promise<SubmitResult> {
  if (!supabase) return { ok: false, error: "BeepAI cloud is not configured on this build." };
  if (!input.contactPhone && !input.contactEmail) {
    return { ok: false, error: "Add a phone number or email so BeepAI can reach you." };
  }

  const requestId = Crypto.randomUUID();
  let sampleFilePath: string | null = null;
  let sampleFileType: string | null = null;
  let sampleUploadBody: File | ArrayBuffer | null = null;
  if (input.sampleFile) {
    const asset = input.sampleFile;
    const extension = asset.name.split(".").pop()?.toLowerCase() ?? "";
    sampleFileType = fileTypes[extension] ?? asset.mimeType ?? null;
    if (!(extension in fileTypes)) return { ok: false, error: "Attach an XLSX, XLS, CSV, PDF, DOCX, or DOC sample file." };
    if ((asset.size ?? 0) > MAX_SAMPLE_BYTES) return { ok: false, error: "Sample files must be 10 MB or smaller." };
    try {
      const fileId = Crypto.randomUUID();
      sampleFilePath = `${requestId}/${fileId}.${extension}`;
      sampleUploadBody = await getUploadBody(asset);
    } catch (cause) {
      return { ok: false, error: cause instanceof Error ? cause.message : "The sample file could not be uploaded." };
    }
  }

  const { error } = await supabase.from("beepai_automation_requests").insert({
    id: requestId,
    description: input.description,
    involved_tools: input.involvedTools,
    frequency: input.frequency,
    contact_name: input.contactName,
    contact_phone: input.contactPhone ?? null,
    contact_email: input.contactEmail ?? null,
    sample_file_path: sampleFilePath,
    sample_file_name: input.sampleFile?.name ?? null,
    sample_file_type: sampleFileType,
    sample_file_size: input.sampleFile?.size ?? null,
    sample_file_uploaded_at: sampleFilePath ? new Date().toISOString() : null,
    sample_file_expires_at: sampleFilePath ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
    status: "submitted",
  });
  if (error) return { ok: false, error: error.message };
  if (sampleFilePath && sampleUploadBody && input.sampleFile) {
    const { error: uploadError } = await supabase.storage.from(SAMPLE_BUCKET).upload(sampleFilePath, sampleUploadBody, { contentType: sampleFileType ?? input.sampleFile.mimeType ?? "application/octet-stream", upsert: false });
    if (uploadError) {
      await supabase.rpc("cancel_beepai_request_with_failed_sample", { p_request_id: requestId });
      return { ok: false, error: `The sample upload failed: ${uploadError.message}` };
    }
  }
  return { ok: true, requestId };
}

export type DeliveredPackage = {
  id: string;
  name: string;
  description: string;
  status: string;
  schedule: string;
  redemption_code: string;
  delivered_at: string;
  configuration: unknown;
  package_file_name: string;
  package_file_type: string;
  javascript_code: string;
  package_file_expires_at: string;
};

export type RedeemResult = { ok: true; package: DeliveredPackage } | { ok: false; error: string };

async function getFunctionErrorMessage(error: unknown): Promise<string> {
  const fallback = error instanceof Error ? error.message : "Package redemption failed. Please try again.";
  const context = (error as { context?: unknown } | null)?.context;
  if (typeof Response !== "undefined" && context instanceof Response) {
    try {
      const payload = await context.clone().json() as { error?: unknown; message?: unknown };
      if (typeof payload.error === "string" && payload.error.trim()) return payload.error;
      if (typeof payload.message === "string" && payload.message.trim()) return payload.message;
    } catch {
      // Keep the Supabase error as a safe fallback if the response is not JSON.
    }
  }
  return fallback;
}

/** A redemption code is a bearer credential; the server returns a short-lived download URL. */
export async function redeemPackage(code: string): Promise<RedeemResult> {
  if (!supabase) return { ok: false, error: "BeepAI cloud is not configured on this build." };
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return { ok: false, error: "Enter the package code your BeepAI admin sent you." };
  const { data, error } = await supabase.functions.invoke("redeem-beep-package", { body: { code: trimmed } });
  if (error) return { ok: false, error: await getFunctionErrorMessage(error) };
  if (!data?.package || !data?.signedUrl) return { ok: false, error: "No package matches that code. Double-check it and try again." };
  const fileResponse = await fetch(data.signedUrl);
  if (!fileResponse.ok) return { ok: false, error: "The package download failed. Check your connection and try again." };
  const javascriptCode = await fileResponse.text();
  return {
    ok: true,
    package: { ...data.package, javascript_code: javascriptCode } as DeliveredPackage,
  };
}
