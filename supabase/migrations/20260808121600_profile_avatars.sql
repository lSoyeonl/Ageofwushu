-- Легенды Кунг-Фу 0.0.48 — аватары пользователей

alter table public.profiles
add column if not exists avatar_url text;

create table if not exists public.public_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default 'Игрок',
  avatar_url text,
  updated_at timestamptz not null default now()
);

create or replace function public.sync_public_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.public_profiles(id,nickname,avatar_url,updated_at)
  values(new.id,new.nickname,new.avatar_url,now())
  on conflict (id) do update
    set nickname=excluded.nickname,
        avatar_url=excluded.avatar_url,
        updated_at=excluded.updated_at;
  return new;
end;
$$;

drop trigger if exists on_profile_public_sync on public.profiles;
create trigger on_profile_public_sync
after insert or update of nickname, avatar_url on public.profiles
for each row execute procedure public.sync_public_profile();

insert into public.public_profiles(id,nickname,avatar_url,updated_at)
select id,nickname,avatar_url,now()
from public.profiles
on conflict (id) do update
set nickname=excluded.nickname,
    avatar_url=excluded.avatar_url,
    updated_at=excluded.updated_at;

create or replace function public.update_my_avatar(new_avatar_url text)
returns table(
  id uuid,
  nickname text,
  email text,
  bio text,
  avatar_url text,
  role text,
  created_at timestamptz,
  last_seen_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.profiles p
  set avatar_url = nullif(trim(new_avatar_url), '')
  where p.id = auth.uid();

  return query
  select p.id,p.nickname,p.email,p.bio,p.avatar_url,p.role,p.created_at,p.last_seen_at
  from public.profiles p
  where p.id = auth.uid();
end;
$$;

revoke all on function public.update_my_avatar(text) from public;
grant execute on function public.update_my_avatar(text) to authenticated;

alter table public.public_profiles enable row level security;

drop policy if exists "public_profiles_public_read" on public.public_profiles;
create policy "public_profiles_public_read"
on public.public_profiles for select
to anon, authenticated
using (true);

grant select on public.public_profiles to anon, authenticated;
