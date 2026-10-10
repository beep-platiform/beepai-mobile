import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store, max-age=0",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: corsHeaders });

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  let body: { code?: unknown };
  try { body = await request.json(); }
  catch { return json({ error: "A redemption code is required." }, 400); }
  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  if (!/^[0-9A-F]{24}$/.test(code)) return json({ error: "Enter the 24-character package code sent by your Beep admin." }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ error: "Package service is temporarily unavailable." }, 503);
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: item, error } = await admin
    .from("beepai_user_automations")
    .select("id,name,description,schedule,configuration,redemption_code,delivered_at,request_id,package_file_path,package_file_name,package_file_type,package_file_size,package_file_expires_at,package_file_deleted_at,redeemed_at")
    .eq("redemption_code", code)
    .not("delivered_at", "is", null)
    .maybeSingle();
  if (error) {
    console.error("redeem package lookup failed", { code: error.code, message: error.message });
    return json({ error: "Could not verify that package right now." }, 503);
  }
  if (!item) return json({ error: "No package matches that code. Double-check it and try again." }, 404);

  if (!item.package_file_path || item.package_file_deleted_at || !item.package_file_name) {
    return json({ error: "This package file is no longer available. Contact your Beep admin." }, 410);
  }
  if (!item.package_file_path.startsWith(`${item.request_id}/`) || !item.package_file_path.toLowerCase().endsWith(".js") || item.package_file_type !== "text/javascript") {
    return json({ error: "This package file could not be verified." }, 409);
  }
  if (!item.package_file_expires_at || new Date(item.package_file_expires_at).getTime() <= Date.now()) {
    return json({ error: "This package has expired. Contact your Beep admin for a replacement." }, 410);
  }

  const { data: signed, error: signError } = await admin.storage
    .from("beepai-automation-packages")
    .createSignedUrl(item.package_file_path, 120);
  if (signError || !signed?.signedUrl) return json({ error: "The private package download is temporarily unavailable." }, 503);

  // Start first-redemption retention only after the artifact is signable.
  const { data: expiryData, error: expiryError } = await admin.rpc("mark_beep_package_redeemed", { p_automation_id: item.id });
  if (expiryError) return json({ error: "Could not activate package redemption." }, 503);
  const expiryRow = Array.isArray(expiryData) ? expiryData[0] : expiryData;
  const expiresAt = expiryRow?.package_file_expires_at ?? item.package_file_expires_at;
  if (!expiresAt || new Date(expiresAt).getTime() <= Date.now()) return json({ error: "This package has expired. Contact your Beep admin for a replacement." }, 410);

  const configuration = item.configuration && typeof item.configuration === "object"
    ? { ...(item.configuration as Record<string, unknown>) }
    : {};
  delete configuration.package_file_path;
  delete configuration.package_file_name;
  delete configuration.package_file_type;
  delete configuration.package_file_size;

  return json({
    package: {
      id: item.id,
      name: item.name,
      description: item.description,
      schedule: item.schedule,
      redemption_code: item.redemption_code,
      delivered_at: item.delivered_at,
      configuration,
      package_file_name: item.package_file_name,
      package_file_type: item.package_file_type,
      package_file_expires_at: expiresAt,
    },
    signedUrl: signed.signedUrl,
    signedUrlExpiresInSeconds: 120,
  });
});
