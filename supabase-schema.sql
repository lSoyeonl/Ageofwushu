-- Легенды Кунг-Фу 0.0.48
-- Выполнить целиком в Supabase -> SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default 'Игрок',
  email text,
  bio text not null default '',
  avatar_url text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);
alter table public.profiles add column if not exists avatar_url text;


create table if not exists public.public_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default 'Игрок',
  avatar_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_store (
  key text primary key,
  value_json jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, nickname, email, bio, role, created_at)
  values(
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'nickname',''), split_part(coalesce(new.email,'Игрок'),'@',1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'bio',''),
    'user',
    now()
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email on auth.users
for each row execute procedure public.handle_new_user();

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

-- Создаём профили для пользователей, которые уже существуют.
insert into public.profiles(id, nickname, email, bio, role, created_at)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data->>'nickname',''), split_part(coalesce(u.email,'Игрок'),'@',1)),
  u.email,
  coalesce(u.raw_user_meta_data->>'bio',''),
  'user',
  coalesce(u.created_at, now())
from auth.users u
on conflict (id) do update set email = excluded.email;

insert into public.public_profiles(id,nickname,avatar_url,updated_at)
select id,nickname,avatar_url,now()
from public.profiles
on conflict (id) do update
set nickname=excluded.nickname,
    avatar_url=excluded.avatar_url,
    updated_at=excluded.updated_at;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

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

create index if not exists idx_site_store_updated_at on public.site_store(updated_at desc);

alter table public.profiles enable row level security;
alter table public.public_profiles enable row level security;
alter table public.site_store enable row level security;

drop policy if exists "public_profiles_public_read" on public.public_profiles;
create policy "public_profiles_public_read"
on public.public_profiles for select
to anon, authenticated
using (true);

grant select on public.public_profiles to anon, authenticated;

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
on public.profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "site_store_public_read" on public.site_store;
create policy "site_store_public_read"
on public.site_store for select
to anon, authenticated
using (true);

-- Админ может изменять любые ключи.
-- Обычные зарегистрированные пользователи могут изменять только
-- форум, игроков и объявления о продаже аккаунтов.
drop policy if exists "site_store_insert" on public.site_store;
create policy "site_store_insert"
on public.site_store for insert
to authenticated
with check (
  public.is_admin()
  or key in ('kungfuForumTopics','kungfuPlayers','kungfuAccountSales')
);

drop policy if exists "site_store_update" on public.site_store;
create policy "site_store_update"
on public.site_store for update
to authenticated
using (
  public.is_admin()
  or key in ('kungfuForumTopics','kungfuPlayers','kungfuAccountSales')
)
with check (
  public.is_admin()
  or key in ('kungfuForumTopics','kungfuPlayers','kungfuAccountSales')
);

drop policy if exists "site_store_delete" on public.site_store;
create policy "site_store_delete"
on public.site_store for delete
to authenticated
using (
  public.is_admin()
  or key in ('kungfuForumTopics','kungfuPlayers','kungfuAccountSales')
);

-- Хранилище изображений.
insert into storage.buckets(id, name, public)
values ('site-images','site-images',true)
on conflict (id) do update set public = true;

drop policy if exists "site_images_public_read" on storage.objects;
create policy "site_images_public_read"
on storage.objects for select
to public
using (bucket_id = 'site-images');

drop policy if exists "site_images_authenticated_insert" on storage.objects;
create policy "site_images_authenticated_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'site-images'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

drop policy if exists "site_images_owner_or_admin_update" on storage.objects;
create policy "site_images_owner_or_admin_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'site-images'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
)
with check (bucket_id = 'site-images');

drop policy if exists "site_images_owner_or_admin_delete" on storage.objects;
create policy "site_images_owner_or_admin_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'site-images'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- Realtime для автоматического обновления контента у посетителей.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'site_store'
  ) then
    alter publication supabase_realtime add table public.site_store;
  end if;
end $$;



-- Реакции пользователей к обновлениям, Тайваню и Пиратке.
create table if not exists public.content_reactions (
  id bigint generated by default as identity primary key,
  content_key text not null,
  entry_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(content_key, entry_id, user_id)
);

create index if not exists idx_content_reactions_entry
on public.content_reactions(content_key, entry_id);

alter table public.content_reactions enable row level security;

drop policy if exists "content_reactions_public_read" on public.content_reactions;
create policy "content_reactions_public_read"
on public.content_reactions for select
to anon, authenticated
using (true);

drop policy if exists "content_reactions_insert_own_or_admin" on public.content_reactions;
create policy "content_reactions_insert_own_or_admin"
on public.content_reactions for insert
to authenticated
with check ((user_id = auth.uid() or public.is_admin()) and rating between 1 and 5);

drop policy if exists "content_reactions_update_own_or_admin" on public.content_reactions;
create policy "content_reactions_update_own_or_admin"
on public.content_reactions for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check ((user_id = auth.uid() or public.is_admin()) and (rating is null or rating between 1 and 5));

drop policy if exists "content_reactions_delete_own_or_admin" on public.content_reactions;
create policy "content_reactions_delete_own_or_admin"
on public.content_reactions for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'content_reactions'
  ) then
    alter publication supabase_realtime add table public.content_reactions;
  end if;
end $$;

-- Легенды Кунг-Фу 0.0.55 — отзывы к партнерам

create table if not exists public.partner_reviews (
  id bigint generated by default as identity primary key,
  partner_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 1500),
  rating smallint check (rating is null or rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_partner_reviews_partner_created
on public.partner_reviews(partner_id, created_at);

alter table public.partner_reviews enable row level security;

drop policy if exists "partner_reviews_public_read" on public.partner_reviews;
create policy "partner_reviews_public_read"
on public.partner_reviews for select
to anon, authenticated
using (true);

drop policy if exists "partner_reviews_insert_own" on public.partner_reviews;
create policy "partner_reviews_insert_own"
on public.partner_reviews for insert
to authenticated
with check (user_id = auth.uid() and (rating is null or rating between 1 and 5));

drop policy if exists "partner_reviews_update_own_or_admin" on public.partner_reviews;
create policy "partner_reviews_update_own_or_admin"
on public.partner_reviews for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check ((user_id = auth.uid() or public.is_admin()) and (rating is null or rating between 1 and 5));

drop policy if exists "partner_reviews_delete_own_or_admin" on public.partner_reviews;
create policy "partner_reviews_delete_own_or_admin"
on public.partner_reviews for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

grant select on public.partner_reviews to anon, authenticated;
grant insert, update, delete on public.partner_reviews to authenticated;
grant usage, select on sequence public.partner_reviews_id_seq to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'partner_reviews'
  ) then
    alter publication supabase_realtime add table public.partner_reviews;
  end if;
end $$;


-- После создания аккаунта администратора выполните отдельно:
-- update public.profiles
-- set role='admin'
-- where email='YOUR_ADMIN_EMAIL@example.com';
