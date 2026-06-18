-- ============================================================
-- Quiniela Mundial 2026 — Schema v2
-- Usa api_match_id (integer de football-data.org) en predictions.
-- No requiere tabla matches ni teams en Supabase.
-- ============================================================

-- DROP (fresh start)
-- drop trigger if exists on_auth_user_created on auth.users;
-- drop function if exists public.handle_new_user();
-- drop view  if exists public.leaderboard;
-- drop table if exists public.predictions;
-- drop table if exists public.profiles;

-- ============================================================
-- TABLAS
-- ============================================================

create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  avatar_url    text,
  total_points  integer not null default 0,
  created_at    timestamptz default now()
);

create table if not exists predictions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id) on delete cascade not null,
  api_match_id    integer not null,
  pred_home       integer not null,
  pred_away       integer not null,
  points_earned   integer,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(user_id, api_match_id)
);

-- ============================================================
-- TRIGGER: auto-crear perfil al registrarse
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- VISTA: leaderboard
-- security_invoker=false → bypasses RLS en predictions
-- (necesario para agregar puntos de todos los usuarios)
-- ============================================================

create or replace view leaderboard
  with (security_invoker = false)
as
  select
    p.id,
    p.username,
    p.avatar_url,
    coalesce(sum(pr.points_earned), 0)::integer           as total_points,
    count(pr.id)::integer                                  as predictions_count,
    count(case when pr.points_earned = 3 then 1 end)::integer as exact_count,
    rank() over (order by coalesce(sum(pr.points_earned), 0) desc)::integer as rank
  from profiles p
  left join predictions pr on pr.user_id = p.id
  group by p.id, p.username, p.avatar_url;

-- ============================================================
-- RLS
-- ============================================================

alter table profiles    enable row level security;
alter table predictions enable row level security;

-- Profiles: lectura pública, update solo propio
create policy "profiles_public_read" on profiles for select using (true);
create policy "profiles_own_update"  on profiles for update using (auth.uid() = id);

-- Predictions: CRUD solo del dueño
-- No chequeo de kickoff en DB — el cliente lo enforce (status='scheduled')
create policy "predictions_own_read" on predictions
  for select using (auth.uid() = user_id);

create policy "predictions_own_insert" on predictions
  for insert with check (auth.uid() = user_id);

create policy "predictions_own_update" on predictions
  for update using (auth.uid() = user_id);

create policy "predictions_own_delete" on predictions
  for delete using (auth.uid() = user_id);
