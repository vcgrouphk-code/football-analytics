-- 足球分析 MVP schema
create extension if not exists "pgcrypto";

-- 使用者設定檔
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  locale text not null default 'zh-TW',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 聯賽
create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  external_id text not null,
  provider text not null default 'api-football',
  name text not null,
  country text,
  season text not null,
  logo_url text,
  unique (provider, external_id, season)
);

-- 球隊
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  external_id text not null,
  provider text not null default 'api-football',
  name text not null,
  short_name text,
  logo_url text,
  unique (provider, external_id)
);

-- 球員
create table public.players (
  id uuid primary key default gen_random_uuid(),
  external_id text not null,
  provider text not null default 'api-football',
  team_id uuid references public.teams (id) on delete set null,
  name text not null,
  position text,
  nationality text,
  unique (provider, external_id)
);

-- 賽事
create type public.fixture_status as enum (
  'scheduled',
  'live',
  'finished',
  'postponed',
  'cancelled'
);

create table public.fixtures (
  id uuid primary key default gen_random_uuid(),
  external_id text not null,
  provider text not null default 'api-football',
  league_id uuid not null references public.leagues (id) on delete cascade,
  home_team_id uuid not null references public.teams (id),
  away_team_id uuid not null references public.teams (id),
  kickoff_at timestamptz not null,
  status public.fixture_status not null default 'scheduled',
  home_score int,
  away_score int,
  venue text,
  round text,
  unique (provider, external_id)
);

create index fixtures_kickoff_idx on public.fixtures (kickoff_at desc);
create index fixtures_league_idx on public.fixtures (league_id);

-- 單場統計
create table public.fixture_stats (
  fixture_id uuid primary key references public.fixtures (id) on delete cascade,
  home_xg numeric(4, 2),
  away_xg numeric(4, 2),
  home_shots int,
  away_shots int,
  home_shots_on_target int,
  away_shots_on_target int,
  home_possession int,
  away_possession int,
  home_corners int,
  away_corners int,
  updated_at timestamptz not null default now()
);

-- 球員單場數據
create table public.player_match_stats (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid not null references public.fixtures (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  minutes int,
  goals int default 0,
  assists int default 0,
  shots int default 0,
  xg numeric(4, 2),
  unique (fixture_id, player_id)
);

-- 收藏
create table public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, team_id)
);

-- 同步紀錄
create table public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  job_name text not null,
  status text not null,
  message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 新使用者建立 profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.leagues enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.fixtures enable row level security;
alter table public.fixture_stats enable row level security;
alter table public.player_match_stats enable row level security;
alter table public.favorites enable row level security;
alter table public.sync_logs enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "public_read_leagues"
  on public.leagues for select
  using (true);

create policy "public_read_teams"
  on public.teams for select
  using (true);

create policy "public_read_players"
  on public.players for select
  using (true);

create policy "public_read_fixtures"
  on public.fixtures for select
  using (true);

create policy "public_read_fixture_stats"
  on public.fixture_stats for select
  using (true);

create policy "public_read_player_match_stats"
  on public.player_match_stats for select
  using (true);

create policy "favorites_own"
  on public.favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sync_logs_service_only"
  on public.sync_logs for select
  using (false);
