-- ============================================================
-- Quiniela Mundial 2026 — Schema completo
-- Para fresh start: corre primero el bloque DROP, luego todo.
-- ============================================================

-- DROP (solo si quieres empezar de cero)
-- drop trigger if exists on_auth_user_created on auth.users;
-- drop function if exists public.handle_new_user();
-- drop function if exists public.score_predictions(uuid);
-- drop view  if exists public.leaderboard;
-- drop table if exists public.predictions;
-- drop table if exists public.profiles;
-- drop table if exists public.matches;
-- drop table if exists public.teams;

-- ============================================================
-- TABLAS
-- ============================================================

create table if not exists teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  short       text not null,
  flag_code   text not null,
  group_name  text,
  created_at  timestamptz default now()
);

create table if not exists matches (
  id              uuid primary key default gen_random_uuid(),
  api_id          integer unique,
  home_team_id    uuid references teams(id),
  away_team_id    uuid references teams(id),
  home_score      integer,
  away_score      integer,
  status          text not null default 'scheduled',
  stage           text not null,
  kickoff_at      timestamptz not null,
  minute          integer,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  avatar_url    text,
  total_points  integer not null default 0,
  created_at    timestamptz default now()
);

create table if not exists predictions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id) on delete cascade,
  match_id        uuid references matches(id) on delete cascade,
  pred_home       integer not null,
  pred_away       integer not null,
  points_earned   integer,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(user_id, match_id)
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

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- VISTAS
-- ============================================================

create or replace view leaderboard as
  select
    p.id,
    p.username,
    p.avatar_url,
    coalesce(sum(pr.points_earned), 0) as total_points,
    count(pr.id)                        as predictions_count,
    count(case when pr.points_earned = 3 then 1 end) as exact_count,
    rank() over (order by coalesce(sum(pr.points_earned), 0) desc) as rank
  from profiles p
  left join predictions pr on pr.user_id = p.id
  group by p.id, p.username, p.avatar_url;

-- ============================================================
-- RLS
-- ============================================================

alter table profiles    enable row level security;
alter table predictions enable row level security;
alter table matches     enable row level security;
alter table teams       enable row level security;

-- Matches y teams: lectura pública
create policy "matches_public_read" on matches for select using (true);
create policy "teams_public_read"   on teams   for select using (true);

-- Profiles: lectura pública, escritura solo del propio usuario
create policy "profiles_public_read" on profiles for select using (true);
create policy "profiles_own_update"  on profiles for update using (auth.uid() = id);

-- Predictions: solo el dueño, bloqueado después del kickoff
create policy "predictions_own_read" on predictions
  for select using (auth.uid() = user_id);

create policy "predictions_own_insert" on predictions
  for insert with check (
    auth.uid() = user_id and
    (select kickoff_at from matches where id = match_id) > now()
  );

create policy "predictions_own_update" on predictions
  for update using (
    auth.uid() = user_id and
    (select kickoff_at from matches where id = match_id) > now()
  );

-- ============================================================
-- FUNCIÓN: calcular puntos al finalizar partido
-- ============================================================

create or replace function score_predictions(p_match_id uuid)
returns void language plpgsql security definer as $$
declare
  v_home          integer;
  v_away          integer;
  v_actual_winner text;
  v_pred_winner   text;
  v_points        integer;
  rec             record;
begin
  select home_score, away_score into v_home, v_away
  from matches where id = p_match_id;

  v_actual_winner := case
    when v_home > v_away then 'home'
    when v_away > v_home then 'away'
    else 'draw'
  end;

  for rec in
    select id, pred_home, pred_away from predictions where match_id = p_match_id
  loop
    v_pred_winner := case
      when rec.pred_home > rec.pred_away then 'home'
      when rec.pred_away > rec.pred_home then 'away'
      else 'draw'
    end;

    v_points := case
      when rec.pred_home = v_home and rec.pred_away = v_away then 3
      when v_pred_winner = v_actual_winner then 1
      else 0
    end;

    update predictions set points_earned = v_points where id = rec.id;
  end loop;

  update profiles p set
    total_points = (
      select coalesce(sum(points_earned), 0)
      from predictions
      where user_id = p.id and points_earned is not null
    )
  where id in (
    select user_id from predictions where match_id = p_match_id
  );
end;
$$;
