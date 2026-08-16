-- Легенды Кунг-Фу 0.0.81 — роль Moderator
-- Выполнить один раз в Supabase -> SQL Editor.
-- Модератор получает те же RLS-права, что администратор, при этом роль хранится как 'moderator'.

begin;

-- Разрешаем третью роль в public.profiles.
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user','admin','moderator'));

-- Сохраняем имя функции, используемое существующими RLS-политиками,
-- но считаем staff и администратора, и модератора.
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

commit;

-- НАЗНАЧЕНИЕ МОДЕРАТОРА:
-- 1) Сначала зарегистрируйте обычный аккаунт через register.html.
-- 2) Затем выполните, заменив e-mail:
-- update public.profiles
-- set role='moderator'
-- where email='moderator@example.com';

-- ПРОВЕРКА:
-- select email, nickname, role
-- from public.profiles
-- where role in ('admin','moderator')
-- order by role, email;
