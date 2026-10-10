-- The redemption Edge Function uses the service role to look up bearer-code metadata.
-- This server-only grant does not expand anon/authenticated client access.
grant select on table public.beepai_user_automations to service_role;
