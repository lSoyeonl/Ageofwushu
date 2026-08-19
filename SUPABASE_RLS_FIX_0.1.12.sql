-- Легенды Кунг-Фу 0.1.12 — исправление RLS для входа и site_store
-- Выполнить ОДИН РАЗ в Supabase -> SQL Editor -> New query -> Run.
-- Скрипт не отключает RLS. Он добавляет явные политики для публичного чтения,
-- прав staff на контент и двух пользовательских общих разделов (форум/игроки).

begin;

-- Актуальная проверка staff: администратор или модератор.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin','moderator')
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- SITE_STORE ---------------------------------------------------------------
alter table public.site_store enable row level security;
grant select on public.site_store to anon, authenticated;
grant insert, update, delete on public.site_store to authenticated;

-- Публичные страницы сайта читают общий контент без входа.
drop policy if exists "kf012 site_store public read" on public.site_store;
create policy "kf012 site_store public read"
on public.site_store
for select
to anon, authenticated
using (true);

-- Администратор и модератор могут создавать любые строки site_store.
drop policy if exists "kf012 site_store staff insert" on public.site_store;
create policy "kf012 site_store staff insert"
on public.site_store
for insert
to authenticated
with check (public.is_admin());

-- Администратор и модератор могут изменять любые строки site_store.
drop policy if exists "kf012 site_store staff update" on public.site_store;
create policy "kf012 site_store staff update"
on public.site_store
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Администратор и модератор могут удалять строки site_store.
drop policy if exists "kf012 site_store staff delete" on public.site_store;
create policy "kf012 site_store staff delete"
on public.site_store
for delete
to authenticated
using (public.is_admin());

-- Обычным вошедшим игрокам нужны записи только в двух общих разделах:
-- форум и каталог игроков. Остальной контент остаётся staff-only.
drop policy if exists "kf012 site_store user shared insert" on public.site_store;
create policy "kf012 site_store user shared insert"
on public.site_store
for insert
to authenticated
with check (
  key in ('kungfuForumTopics','kungfuPlayers')
  and updated_by = auth.uid()
);

drop policy if exists "kf012 site_store user shared update" on public.site_store;
create policy "kf012 site_store user shared update"
on public.site_store
for update
to authenticated
using (key in ('kungfuForumTopics','kungfuPlayers'))
with check (
  key in ('kungfuForumTopics','kungfuPlayers')
  and updated_by = auth.uid()
);

-- PROFILES -----------------------------------------------------------------
-- Вход через Supabase Auth уже может быть успешным, но сайт после этого читает
-- public.profiles. Явно разрешаем пользователю читать собственный профиль.
alter table public.profiles enable row level security;
grant select on public.profiles to authenticated;

drop policy if exists "kf012 profiles own select" on public.profiles;
create policy "kf012 profiles own select"
on public.profiles
for select
to authenticated
using (id = auth.uid());

-- Staff может читать профили (нужно для административных функций).
drop policy if exists "kf012 profiles staff select" on public.profiles;
create policy "kf012 profiles staff select"
on public.profiles
for select
to authenticated
using (public.is_admin());

commit;

-- ПРОВЕРКА ПОСЛЕ RUN:
-- select schemaname, tablename, policyname, roles, cmd
-- from pg_policies
-- where schemaname='public' and tablename in ('site_store','profiles')
-- order by tablename, cmd, policyname;
