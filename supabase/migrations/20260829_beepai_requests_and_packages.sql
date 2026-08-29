-- BeepAI: admin roles, public (no-account) automation requests, and package delivery/redemption.
--
-- This migration assumes 20260828_create_beepai_core.sql has already been applied.
-- Apply this against the shared BeepAI Supabase project (bioqlzpqxfsyrbtssglj) via the
-- Supabase SQL editor or `supabase db push`. It is written to be safe to re-run.

-- 1. Admin role table -------------------------------------------------------
-- Membership here is what makes the /control-room admin dashboard able to see
-- every customer's requests and automations, instead of only its own.
create table if not exists public.beepai_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.beepai_admins enable row level security;

-- No public policies: this table is only ever read through the is_admin()
-- security-definer function below, never selected directly by clients.

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.beepai_admins where user_id = auth.uid()
  );
$$;

-- To make your own account an admin, run once (after signing up):
--   insert into public.beepai_admins (user_id)
--   select id from auth.users where email = 'you@example.com';

-- 2. Automation requests: allow submission without a customer account ------
-- The mobile app cannot assume every customer has (or wants) a full Supabase
-- account, so requests are captured with direct contact details instead.
alter table public.beepai_automation_requests
  alter column user_id drop not null;

alter table public.beepai_automation_requests
  add column if not exists contact_name text,
  add column if not exists contact_phone text,
  add column if not exists contact_email text;

alter table public.beepai_automation_requests
  drop constraint if exists beepai_automation_requests_contact_check;
alter table public.beepai_automation_requests
  add constraint beepai_automation_requests_contact_check
  check (
    contact_name is not null and char_length(contact_name) between 1 and 200
    and (contact_phone is not null or contact_email is not null)
  );

drop policy if exists "Users manage own BeepAI requests" on public.beepai_automation_requests;

drop policy if exists "Anyone can submit a BeepAI request" on public.beepai_automation_requests;
create policy "Anyone can submit a BeepAI request"
  on public.beepai_automation_requests
  for insert
  to anon, authenticated
  with check (status = 'submitted');

drop policy if exists "Admins can view all BeepAI requests" on public.beepai_automation_requests;
create policy "Admins can view all BeepAI requests"
  on public.beepai_automation_requests
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can update BeepAI requests" on public.beepai_automation_requests;
create policy "Admins can update BeepAI requests"
  on public.beepai_automation_requests
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 3. User automations: link back to the originating request, add package fields
alter table public.beepai_user_automations
  alter column user_id drop not null;

alter table public.beepai_user_automations
  add column if not exists request_id uuid references public.beepai_automation_requests(id) on delete set null,
  add column if not exists redemption_code text unique,
  add column if not exists delivered_at timestamptz;

drop policy if exists "Admins manage BeepAI automations" on public.beepai_user_automations;
create policy "Admins manage BeepAI automations"
  on public.beepai_user_automations
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 4. Package redemption ------------------------------------------------------
-- The redemption code is the credential: a customer who was given the code
-- (by the admin, over phone/WhatsApp/email) can pull down exactly that one
-- delivered automation, without needing an account. Nothing else in
-- beepai_user_automations is selectable by anon/authenticated non-admins.
create or replace function public.get_beepai_package(p_code text)
returns setof public.beepai_user_automations
language sql
security definer
stable
set search_path = public
as $$
  select *
  from public.beepai_user_automations
  where redemption_code = upper(trim(p_code))
    and delivered_at is not null;
$$;

grant execute on function public.get_beepai_package(text) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;

-- 5. Admin package delivery ---------------------------------------------------
-- Single atomic action for "build it and send the customer their package":
-- creates the delivered automation record, generates its redemption code,
-- and marks the originating request as delivered.
create or replace function public.admin_deliver_automation_request(
  p_request_id uuid,
  p_name text,
  p_description text,
  p_schedule text default 'On demand'
)
returns table(automation_id uuid, redemption_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only BeepAI admins can deliver a package';
  end if;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.beepai_user_automations
    (user_id, request_id, name, description, status, schedule, configuration, redemption_code, delivered_at)
  values
    (null, p_request_id, p_name, p_description, 'active', coalesce(p_schedule, 'On demand'), '{}'::jsonb, v_code, now())
  returning id into v_id;

  update public.beepai_automation_requests
    set status = 'delivered', updated_at = now()
    where id = p_request_id;

  return query select v_id, v_code;
end;
$$;

grant execute on function public.admin_deliver_automation_request(uuid, text, text, text) to authenticated;
