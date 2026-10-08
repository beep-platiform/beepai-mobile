-- BEEP request samples and Python automation artifacts are private, temporary
-- objects. The application tables retain metadata after Storage deletes bytes.

create extension if not exists pg_cron;
create extension if not exists pg_net;

alter table public.beepai_automation_requests
  add column if not exists sample_file_path text,
  add column if not exists sample_file_name text,
  add column if not exists sample_file_type text,
  add column if not exists sample_file_size bigint,
  add column if not exists sample_file_uploaded_at timestamptz,
  add column if not exists sample_file_expires_at timestamptz,
  add column if not exists sample_file_deleted_at timestamptz;

alter table public.beepai_user_automations
  add column if not exists package_file_path text,
  add column if not exists package_file_name text,
  add column if not exists package_file_size bigint,
  add column if not exists package_file_expires_at timestamptz,
  add column if not exists package_file_deleted_at timestamptz,
  add column if not exists redeemed_at timestamptz;

create index if not exists beepai_requests_sample_expiry_idx
  on public.beepai_automation_requests (sample_file_expires_at)
  where sample_file_path is not null;
create index if not exists beepai_automation_package_expiry_idx
  on public.beepai_user_automations (package_file_expires_at)
  where package_file_path is not null;

-- Customer examples are private and only Beep admins can read them.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'beepai-request-samples',
  'beepai-request-samples',
  false,
  10485760,
  array[
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ]::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Admin-approved Python source artifacts are also private.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('beepai-automation-packages', 'beepai-automation-packages', false, 1048576, array['text/x-python', 'text/plain']::text[])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage can validate one exact request reservation without granting anon
-- readers access to the request rows themselves.
create or replace function public.beep_request_sample_upload_allowed(p_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.beepai_automation_requests r
    where r.id::text = split_part(p_path, '/', 1)
      and r.sample_file_path = p_path
      and r.sample_file_deleted_at is null
      and r.status = 'submitted'
  );
$$;
revoke all on function public.beep_request_sample_upload_allowed(text) from public;
grant execute on function public.beep_request_sample_upload_allowed(text) to anon, authenticated;

drop policy if exists "BEEP customers upload request samples" on storage.objects;
create policy "BEEP customers upload request samples"
on storage.objects for insert to anon, authenticated
with check (
  bucket_id = 'beepai-request-samples'
  and auth.role() in ('anon', 'authenticated')
  and name ~* '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](xlsx|xls|csv|pdf|docx|doc)$'
  and public.beep_request_sample_upload_allowed(name)
);

drop policy if exists "BEEP admins read request samples" on storage.objects;
create policy "BEEP admins read request samples"
on storage.objects for select to authenticated
using (bucket_id = 'beepai-request-samples' and public.is_admin());

drop policy if exists "BEEP admins upload Python packages" on storage.objects;
create policy "BEEP admins upload Python packages"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'beepai-automation-packages'
  and public.is_admin()
  and name ~* '^[0-9a-f-]{36}/[0-9a-f-]{36}[.]py$'
);

drop policy if exists "BEEP admins read Python packages" on storage.objects;
create policy "BEEP admins read Python packages"
on storage.objects for select to authenticated
using (bucket_id = 'beepai-automation-packages' and public.is_admin());

drop policy if exists "BEEP admins delete Python packages" on storage.objects;
create policy "BEEP admins delete Python packages"
on storage.objects for delete to authenticated
using (bucket_id = 'beepai-automation-packages' and public.is_admin());

-- Remove an incomplete request only when no sample object was uploaded.
create or replace function public.cancel_beepai_request_with_failed_sample(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_path text;
begin
  select sample_file_path into v_path
    from public.beepai_automation_requests
    where id = p_request_id and status = 'submitted' and sample_file_deleted_at is null;
  if v_path is null then raise exception 'Request is not an incomplete sample upload'; end if;
  if exists (select 1 from storage.objects where bucket_id = 'beepai-request-samples' and name = v_path) then
    raise exception 'Sample already uploaded; request was retained';
  end if;
  delete from public.beepai_automation_requests where id = p_request_id;
end;
$$;
revoke all on function public.cancel_beepai_request_with_failed_sample(uuid) from public;
grant execute on function public.cancel_beepai_request_with_failed_sample(uuid) to anon, authenticated;

-- Submission policy is unchanged. This RPC remains admin-only and rejects a
-- package unless its uploaded path belongs to the request and ends in .py.
create or replace function public.admin_deliver_automation_request(
  p_request_id uuid,
  p_name text,
  p_description text,
  p_schedule text default 'On demand',
  p_configuration jsonb default '{}'::jsonb
)
returns table(automation_id uuid, redemption_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_id uuid;
  v_path text;
  v_file_name text;
  v_file_size bigint;
begin
  if not public.is_admin() then
    raise exception 'Only BeepAI admins can deliver a package';
  end if;

  v_path := p_configuration ->> 'package_file_path';
  v_file_name := p_configuration ->> 'package_file_name';
  v_file_size := nullif(p_configuration ->> 'package_file_size', '')::bigint;
  if v_path is null
     or v_file_name is null
     or v_file_size is null
     or v_file_size < 1
     or v_file_size > 1048576
     or v_path !~* ('^' || p_request_id::text || '/[0-9a-f-]{36}[.]py$') then
    raise exception 'A valid uploaded Python package for this request is required';
  end if;
  if not exists (select 1 from public.beepai_automation_requests r where r.id = p_request_id) then
    raise exception 'Automation request not found';
  end if;
  if not exists (select 1 from storage.objects o where o.bucket_id = 'beepai-automation-packages' and o.name = v_path) then
    raise exception 'Uploaded Python package was not found in private storage';
  end if;

  -- 96 random bits; the code is a bearer credential for the private package.
  v_code := upper(encode(gen_random_bytes(12), 'hex'));

  insert into public.beepai_user_automations
    (user_id, request_id, name, description, status, schedule, configuration,
     redemption_code, delivered_at, package_file_path, package_file_name,
     package_file_size, package_file_expires_at)
  values
    (null, p_request_id, p_name, p_description, 'active',
     coalesce(p_schedule, 'On demand'), coalesce(p_configuration, '{}'::jsonb),
     v_code, now(), v_path, v_file_name, v_file_size, now() + interval '30 days')
  returning id into v_id;

  update public.beepai_automation_requests
    set status = 'delivered', updated_at = now()
    where id = p_request_id;

  return query select v_id, v_code;
end;
$$;

grant execute on function public.admin_deliver_automation_request(uuid, text, text, text, jsonb) to authenticated;

-- No anonymous RPC may reveal the full automation row or its storage path.
revoke execute on function public.get_beepai_package(text) from public, anon, authenticated;
-- A phone number is guessable and is not a package credential.
revoke execute on function public.check_pending_delivery(text) from public, anon, authenticated;

-- Edge cleanup authenticates with a random value held in Vault, not a public
-- API key. Only the service role can retrieve it through this RPC.
do $$
begin
  if not exists (select 1 from vault.decrypted_secrets where name = 'beep_file_retention_token') then
    perform vault.create_secret(encode(gen_random_bytes(32), 'hex'), 'beep_file_retention_token', 'BEEP hourly temporary-file cleanup authentication');
  end if;
end;
$$;

create or replace function public.get_beep_file_retention_token()
returns text
language plpgsql
security definer
set search_path = public, vault, auth
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Only the service role may read the cleanup token';
  end if;
  return (select decrypted_secret from vault.decrypted_secrets where name = 'beep_file_retention_token' limit 1);
end;
$$;
revoke all on function public.get_beep_file_retention_token() from public, anon, authenticated;
grant execute on function public.get_beep_file_retention_token() to service_role;

-- Extend the request sample retention through the customer's first week with
-- the package, and make the package itself expire one week after redemption.
create or replace function public.mark_beep_package_redeemed(p_automation_id uuid)
returns table(package_file_expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expiry timestamptz;
  v_request_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Only the service role may redeem a package';
  end if;
  select a.package_file_expires_at, a.request_id
    into v_expiry, v_request_id
    from public.beepai_user_automations a
    where a.id = p_automation_id
    for update;
  if not found then raise exception 'Package not found'; end if;

  if (select redeemed_at from public.beepai_user_automations where id = p_automation_id) is null then
    v_expiry := now() + interval '7 days';
    update public.beepai_user_automations
      set redeemed_at = now(), package_file_expires_at = v_expiry
      where id = p_automation_id;
    update public.beepai_automation_requests
      set sample_file_expires_at = now() + interval '7 days', updated_at = now()
      where id = v_request_id and sample_file_path is not null;
  end if;

  return query select v_expiry;
end;
$$;
revoke all on function public.mark_beep_package_redeemed(uuid) from public, anon, authenticated;
grant execute on function public.mark_beep_package_redeemed(uuid) to service_role;

-- Remove any older job with this owned name, then run hourly. Supabase Storage
-- deletes bytes through its API; DB metadata remains with paths nulled.
do $$
declare
  v_job_id bigint;
begin
  for v_job_id in select jobid from cron.job where jobname = 'beep-file-retention-cleanup' loop
    perform cron.unschedule(v_job_id);
  end loop;
  perform cron.schedule(
    'beep-file-retention-cleanup',
    '0 * * * *',
    $job$
      select net.http_post(
        url := 'https://bioqlzpqxfsyrbtssglj.supabase.co/functions/v1/cleanup-beep-files',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-beep-retention-token', (select decrypted_secret from vault.decrypted_secrets where name = 'beep_file_retention_token' limit 1)
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 10000
      );
    $job$
  );
end;
$$;
