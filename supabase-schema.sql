-- Patch app schema
-- Run once in the Supabase SQL editor

-- ── Tables ────────────────────────────────────────────────────────────────────

create table if not exists public.messages (
  id          text        primary key,
  user_id     uuid        not null references auth.users on delete cascade,
  sender      text        not null,
  msg_text    text,
  image_data  text,
  ts          bigint      not null,
  metadata    jsonb       not null default '{}'
);

create table if not exists public.food_logs (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users on delete cascade,
  log_date    text        not null,
  meal_type   text,
  log_time    text,
  description text,
  ingredients jsonb       not null default '[]',
  allergens   jsonb       not null default '[]',
  ts          bigint      not null,
  is_pending  boolean     not null default false,
  msg_ref     text
);

create table if not exists public.symptom_logs (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users on delete cascade,
  log_date    text        not null,
  severity    smallint    not null,
  conditions  jsonb       not null default '[]',
  ts          bigint      not null
);

create table if not exists public.user_data (
  user_id     uuid        primary key references auth.users on delete cascade,
  doctors     jsonb       not null default '[]',
  onboarded   boolean     not null default false,
  updated_at  timestamptz not null default now()
);

-- ── Row level security ────────────────────────────────────────────────────────

alter table public.messages     enable row level security;
alter table public.food_logs    enable row level security;
alter table public.symptom_logs enable row level security;
alter table public.user_data    enable row level security;

create policy "users manage own messages"
  on public.messages for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage own food_logs"
  on public.food_logs for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage own symptom_logs"
  on public.symptom_logs for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage own user_data"
  on public.user_data for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
