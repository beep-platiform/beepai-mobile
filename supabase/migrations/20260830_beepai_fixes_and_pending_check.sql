-- BeepAI: fixes discovered while debugging the live request flow, plus a
-- phone-based "is my package ready yet" check used to power a local
-- notification when a package becomes available.

-- 1. Grants missing from the original 20260829 migration ---------------------
-- RLS policies are meaningless without the underlying table-level grant.
-- These were applied directly against the live project while debugging
-- "permission denied for table" errors; recorded here so a fresh
-- `supabase db push` reproduces the same working state.
grant insert on public.beepai_automation_requests to anon, authenticated;
grant select, update on public.beepai_automation_requests to authenticated;
grant select, insert, update on public.beepai_user_automations to authenticated;
grant select on public.beepai_automation_runs to authenticated;

drop policy if exists "Admins can view all BeepAI runs" on public.beepai_automation_runs;
create policy "Admins can view all BeepAI runs"
  on public.beepai_automation_runs
  for select
  to authenticated
  using (public.is_admin());

-- 2. Pending package check ---------------------------------------------------
-- The customer only knows their own phone number (not their request id), so
-- this lets the app ask "has anything been delivered for this phone yet?"
-- without exposing any other customer's data. Like get_beepai_package, this
-- is intentionally narrow: exact phone match only, delivered packages only.
create or replace function public.check_pending_delivery(p_phone text)
returns table(name text, description text, schedule text, redemption_code text)
language sql
security definer
stable
set search_path = public
as $$
  select ua.name, ua.description, ua.schedule, ua.redemption_code
  from public.beepai_user_automations ua
  join public.beepai_automation_requests r on r.id = ua.request_id
  where r.contact_phone = trim(p_phone)
    and ua.delivered_at is not null
  order by ua.delivered_at desc
  limit 1;
$$;

grant execute on function public.check_pending_delivery(text) to anon, authenticated;
