-- pgcrypto is installed in the `extensions` schema, while the delivery
-- function deliberately fixes search_path to `public`. Qualify the RNG call.
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
  v_file_type text;
  v_file_size bigint;
  v_request_status text;
  v_configuration jsonb;
begin
  if not public.is_admin() then raise exception 'Only BeepAI admins can deliver a package'; end if;

  v_path := p_configuration ->> 'package_file_path';
  v_file_name := p_configuration ->> 'package_file_name';
  v_file_type := p_configuration ->> 'package_file_type';
  v_file_size := nullif(p_configuration ->> 'package_file_size', '')::bigint;
  if v_path is null
     or v_file_name is null
     or v_file_type is distinct from 'text/javascript'
     or v_file_size is null
     or v_file_size < 1
     or v_file_size > 1048576
     or v_file_name !~* '[.]js$'
     or coalesce(p_configuration ->> 'runtime', '') <> 'javascript'
     or v_path !~* ('^' || p_request_id::text || '/[0-9a-f-]{36}[.]js$') then
    raise exception 'A valid uploaded JavaScript package for this request is required';
  end if;

  select r.status into v_request_status
    from public.beepai_automation_requests r
    where r.id = p_request_id
    for update;
  if not found then raise exception 'Automation request not found'; end if;
  if v_request_status not in ('approved', 'building') then
    raise exception 'Approve or begin building this request before delivering a package';
  end if;
  if not exists (
    select 1 from storage.objects o
    where o.bucket_id = 'beepai-automation-packages' and o.name = v_path
  ) then
    raise exception 'Uploaded JavaScript package was not found in private storage';
  end if;

  -- Whitelist only metadata and declarative workflow steps; source text is
  -- never copied from client JSON into a database row.
  v_configuration := jsonb_build_object(
    'runtime', 'javascript',
    'package_file_path', v_path,
    'package_file_name', v_file_name,
    'package_file_type', v_file_type,
    'package_file_size', v_file_size
  );
  if jsonb_typeof(p_configuration -> 'steps') = 'array' then
    v_configuration := v_configuration || jsonb_build_object('steps', p_configuration -> 'steps');
  end if;

  v_code := upper(encode(extensions.gen_random_bytes(12), 'hex'));
  insert into public.beepai_user_automations
    (user_id, request_id, name, description, status, schedule, configuration,
     redemption_code, delivered_at, package_file_path, package_file_name,
     package_file_type, package_file_size, package_file_expires_at)
  values
    (null, p_request_id, p_name, p_description, 'active',
     coalesce(p_schedule, 'On demand'), v_configuration,
     v_code, now(), v_path, v_file_name, v_file_type, v_file_size,
     now() + interval '30 days')
  returning id into v_id;

  update public.beepai_automation_requests
    set status = 'delivered', updated_at = now()
    where id = p_request_id;
  return query select v_id, v_code;
end;
$$;

grant execute on function public.admin_deliver_automation_request(uuid, text, text, text, jsonb) to authenticated;
