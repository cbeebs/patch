-- Run this in the Supabase SQL editor

create table if not exists public.messages (
  id              text        not null,
  user_id         uuid        not null references auth.users(id) on delete cascade,
  sender          text        not null check (sender in ('user','patch')),
  content         text,
  image           text,
  ts              bigint      not null,
  allergen_picker jsonb,
  allergen_done   boolean     default false,
  created_at      timestamptz default now(),
  primary key (id, user_id)
);

create table if not exists public.food_logs (
  id           uuid        not null default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  log_date     text        not null,
  meal         text,
  log_time     text,
  description  text,
  ingredients  jsonb       default '[]',
  allergens    jsonb       default '[]',
  ts           bigint      not null,
  pending      boolean     default false,
  msg_id       text,
  product_name text,
  brand        text,
  nutritional  jsonb,
  source       text,
  created_at   timestamptz default now(),
  primary key (id)
);

create table if not exists public.symptom_logs (
  id         uuid        not null default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  log_date   text        not null,
  severity   integer     not null check (severity >= 0 and severity <= 5),
  conditions jsonb       default '[]',
  ts         bigint      not null,
  created_at timestamptz default now(),
  primary key (id)
);

create table if not exists public.doctors (
  id         text        not null,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  doc_name   text        not null,
  spec       text,
  initials   text,
  emoji      text,
  bio        text,
  created_at timestamptz default now(),
  primary key (id, user_id)
);

create table if not exists public.user_settings (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  onboarded  boolean     default false,
  updated_at timestamptz default now(),
  primary key (user_id)
);

-- RLS
alter table public.messages      enable row level security;
alter table public.food_logs     enable row level security;
alter table public.symptom_logs  enable row level security;
alter table public.doctors       enable row level security;
alter table public.user_settings enable row level security;

create policy "own messages"
  on public.messages for all to authenticated
  using       (auth.uid() = user_id)
  with check  (auth.uid() = user_id);

create policy "own food_logs"
  on public.food_logs for all to authenticated
  using       (auth.uid() = user_id)
  with check  (auth.uid() = user_id);

create policy "own symptom_logs"
  on public.symptom_logs for all to authenticated
  using       (auth.uid() = user_id)
  with check  (auth.uid() = user_id);

create policy "own doctors"
  on public.doctors for all to authenticated
  using       (auth.uid() = user_id)
  with check  (auth.uid() = user_id);

create policy "own user_settings"
  on public.user_settings for all to authenticated
  using       (auth.uid() = user_id)
  with check  (auth.uid() = user_id);
