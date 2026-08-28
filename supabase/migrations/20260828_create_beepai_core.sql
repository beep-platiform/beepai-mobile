create extension if not exists "pgcrypto";

create table if not exists public.beepai_subscription_plans (
  id text primary key,
  name text not null unique,
  monthly_price_rwf integer not null check (monthly_price_rwf >= 0),
  summary text not null,
  features jsonb not null default '[]'::jsonb,
  accent text not null,
  sort_order smallint not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.beepai_automation_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  category text not null,
  workflow jsonb not null default '[]'::jsonb,
  required_permissions jsonb not null default '[]'::jsonb,
  minimum_plan_id text references public.beepai_subscription_plans(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.beepai_automation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null check (char_length(description) between 1 and 3000),
  involved_tools jsonb not null default '[]'::jsonb,
  frequency text not null,
  status text not null default 'submitted' check (status in ('submitted', 'reviewing', 'approved', 'building', 'delivered', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.beepai_user_automations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid references public.beepai_automation_templates(id) on delete set null,
  name text not null,
  description text not null,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  schedule text not null default 'On demand',
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.beepai_automation_runs (
  id uuid primary key default gen_random_uuid(),
  user_automation_id uuid not null references public.beepai_user_automations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('success', 'failed', 'running', 'cancelled')),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  summary text not null,
  created_at timestamptz not null default now()
);

create index if not exists beepai_requests_user_created_idx on public.beepai_automation_requests(user_id, created_at desc);
create index if not exists beepai_user_automations_user_idx on public.beepai_user_automations(user_id, updated_at desc);
create index if not exists beepai_runs_user_created_idx on public.beepai_automation_runs(user_id, created_at desc);

alter table public.beepai_subscription_plans enable row level security;
alter table public.beepai_automation_templates enable row level security;
alter table public.beepai_automation_requests enable row level security;
alter table public.beepai_user_automations enable row level security;
alter table public.beepai_automation_runs enable row level security;

drop policy if exists "Public can view active BeepAI plans" on public.beepai_subscription_plans;
create policy "Public can view active BeepAI plans" on public.beepai_subscription_plans for select using (is_active = true);

drop policy if exists "Public can view active BeepAI templates" on public.beepai_automation_templates;
create policy "Public can view active BeepAI templates" on public.beepai_automation_templates for select using (is_active = true);

drop policy if exists "Users manage own BeepAI requests" on public.beepai_automation_requests;
create policy "Users manage own BeepAI requests" on public.beepai_automation_requests for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own BeepAI automations" on public.beepai_user_automations;
create policy "Users manage own BeepAI automations" on public.beepai_user_automations for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own BeepAI runs" on public.beepai_automation_runs;
create policy "Users manage own BeepAI runs" on public.beepai_automation_runs for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.beepai_subscription_plans (id, name, monthly_price_rwf, summary, features, accent, sort_order)
values
  ('free', 'Free', 0, 'A private start for simple tasks.', '["1 basic automation", "Up to 30 runs / month", "Offline execution"]'::jsonb, '#16A34A', 1),
  ('personal', 'Personal', 2000, 'More automations for individual work.', '["Up to 5 automations", "Up to 500 runs / month", "Scheduled automations"]'::jsonb, '#2563EB', 2),
  ('professional', 'Professional', 10000, 'Built for productive professional teams.', '["Up to 20 automations", "Unlimited runs", "Priority support"]'::jsonb, '#7C3AED', 3),
  ('business', 'Business', 25000, 'Scale automation across your business.', '["Unlimited automations", "Multi-user workspace", "API access"]'::jsonb, '#EA580C', 4)
on conflict (id) do update set
  name = excluded.name,
  monthly_price_rwf = excluded.monthly_price_rwf,
  summary = excluded.summary,
  features = excluded.features,
  accent = excluded.accent,
  sort_order = excluded.sort_order,
  updated_at = now();
