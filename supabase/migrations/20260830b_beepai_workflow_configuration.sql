-- BeepAI: admin_deliver_automation_request now accepts a real workflow
-- definition (JSON steps) instead of always defaulting to '{}'. This is what
-- lets "Run" on the customer's device actually do something, instead of a
-- simulated timer.

drop function if exists public.admin_deliver_automation_request(uuid, text, text, text);

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
begin
  if not public.is_admin() then
    raise exception 'Only BeepAI admins can deliver a package';
  end if;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.beepai_user_automations
    (user_id, request_id, name, description, status, schedule, configuration, redemption_code, delivered_at)
  values
    (null, p_request_id, p_name, p_description, 'active', coalesce(p_schedule, 'On demand'), coalesce(p_configuration, '{}'::jsonb), v_code, now())
  returning id into v_id;

  update public.beepai_automation_requests
    set status = 'delivered', updated_at = now()
    where id = p_request_id;

  return query select v_id, v_code;
end;
$$;

grant execute on function public.admin_deliver_automation_request(uuid, text, text, text, jsonb) to authenticated;

-- Expected shape of `configuration` (documented here, not enforced by a
-- schema, per the "automations are data, not code" principle):
-- { "steps": [
--     { "type": "EXCEL_READ" },
--     { "type": "EXCEL_SUM", "column": "Amount" },
--     { "type": "MESSAGE_TEMPLATE", "template": "Total: {EXCEL_SUM}" }
-- ] }
