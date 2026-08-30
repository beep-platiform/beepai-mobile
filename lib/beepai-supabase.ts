import Constants from "expo-constants";
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
};

export type SubmitResult = { ok: true } | { ok: false; error: string };

/**
 * Sends a plain-language automation request straight into the same
 * beepai_automation_requests table the website's admin control room reads.
 * No account is required: the requester is identified by contact info only.
 *
 * Note: this deliberately does NOT chain .select() after .insert(). The
 * anon role only has INSERT privilege on this table (not SELECT), by design,
 * so requesters can't browse other people's requests. Asking PostgREST to
 * return the inserted row would fail the whole write with a permission
 * error, even though the insert itself is allowed.
 */
export async function submitAutomationRequest(input: AutomationRequestInput): Promise<SubmitResult> {
  if (!supabase) return { ok: false, error: "BeepAI cloud is not configured on this build." };
  if (!input.contactPhone && !input.contactEmail) {
    return { ok: false, error: "Add a phone number or email so BeepAI can reach you." };
  }
  const { error } = await supabase.from("beepai_automation_requests").insert({
    description: input.description,
    involved_tools: input.involvedTools,
    frequency: input.frequency,
    contact_name: input.contactName,
    contact_phone: input.contactPhone ?? null,
    contact_email: input.contactEmail ?? null,
    status: "submitted",
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export type PendingPackage = { name: string; description: string; schedule: string; redemptionCode: string };

/**
 * Asks "has a package been delivered for this phone number yet?" without
 * needing the code itself. Used to power a local notification the moment a
 * package becomes available, without any account or push token.
 */
export async function checkPendingDelivery(phone: string): Promise<PendingPackage | null> {
  if (!supabase || !phone.trim()) return null;
  const { data, error } = await supabase.rpc("check_pending_delivery", { p_phone: phone.trim() });
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return { name: row.name, description: row.description, schedule: row.schedule, redemptionCode: row.redemption_code };
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
};

export type RedeemResult = { ok: true; package: DeliveredPackage } | { ok: false; error: string };

/**
 * Looks up a delivered automation package by its redemption code. The code
 * itself is the credential — this works without the customer ever creating
 * a BeepAI account.
 */
export async function redeemPackage(code: string): Promise<RedeemResult> {
  if (!supabase) return { ok: false, error: "BeepAI cloud is not configured on this build." };
  const trimmed = code.trim();
  if (!trimmed) return { ok: false, error: "Enter the package code your BeepAI admin sent you." };
  const { data, error } = await supabase.rpc("get_beepai_package", { p_code: trimmed });
  if (error) return { ok: false, error: error.message };
  const pkg = Array.isArray(data) ? data[0] : data;
  if (!pkg) return { ok: false, error: "No package matches that code. Double-check it and try again." };
  return { ok: true, package: pkg as DeliveredPackage };
}
