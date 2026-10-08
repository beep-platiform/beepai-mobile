import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, x-beep-retention-token", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json", "Cache-Control": "no-store, max-age=0" };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: corsHeaders });

type ExpiredObject = { id: string; sample_file_path?: string | null; package_file_path?: string | null };

async function purgeTable(admin: ReturnType<typeof createClient>, table: string, pathColumn: "sample_file_path" | "package_file_path", expiryColumn: "sample_file_expires_at" | "package_file_expires_at", bucket: string, deletedColumn: "sample_file_deleted_at" | "package_file_deleted_at", now: string) {
  const { data, error } = await admin.from(table).select(`id,${pathColumn}`).not(pathColumn, "is", null).lte(expiryColumn, now).limit(500);
  if (error) throw new Error(`${table} expiry lookup failed: ${error.message}`);
  const rows = (data ?? []) as ExpiredObject[];
  if (!rows.length) return 0;

  const paths = rows.map((row) => row[pathColumn]).filter((value): value is string => Boolean(value));
  const { error: removeError } = await admin.storage.from(bucket).remove(paths);
  if (removeError) throw new Error(`${bucket} object deletion failed: ${removeError.message}`);

  const { error: updateError } = await admin.from(table).update({ [pathColumn]: null, [deletedColumn]: now }).in("id", rows.map((row) => row.id));
  if (updateError) throw new Error(`${table} expiry metadata update failed: ${updateError.message}`);
  return paths.length;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return reply({ error: "Method not allowed." }, 405);

  const suppliedToken = request.headers.get("x-beep-retention-token") ?? "";
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return reply({ error: "Retention service is not configured." }, 503);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: expectedToken, error: tokenError } = await admin.rpc("get_beep_file_retention_token");
  if (tokenError || typeof expectedToken !== "string" || expectedToken.length < 32 || suppliedToken !== expectedToken) {
    return reply({ error: "Unauthorized." }, 401);
  }

  const now = new Date().toISOString();
  try {
    const samplesDeleted = await purgeTable(admin, "beepai_automation_requests", "sample_file_path", "sample_file_expires_at", "beepai-request-samples", "sample_file_deleted_at", now);
    const packagesDeleted = await purgeTable(admin, "beepai_user_automations", "package_file_path", "package_file_expires_at", "beepai-automation-packages", "package_file_deleted_at", now);
    return reply({ ok: true, samplesDeleted, packagesDeleted, ranAt: now });
  } catch (error) {
    console.error("BEEP file retention cleanup failed", error);
    return reply({ error: error instanceof Error ? error.message : "Cleanup failed." }, 500);
  }
});
