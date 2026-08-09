-- Легенды Кунг-Фу 0.0.58 — редактирование описания своего профиля

create or replace function public.update_my_bio(new_bio text)
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

  if char_length(coalesce(new_bio,'')) > 1000 then
    raise exception 'bio too long';
  end if;

  update public.profiles p
  set bio = trim(coalesce(new_bio,''))
  where p.id = auth.uid();

  return query
  select p.id,p.nickname,p.email,p.bio,p.avatar_url,p.role,p.created_at,p.last_seen_at
  from public.profiles p
  where p.id = auth.uid();
end;
$$;

revoke all on function public.update_my_bio(text) from public;
grant execute on function public.update_my_bio(text) to authenticated;
