-- Легенды Кунг-Фу 0.0.56 — оценки партнеров 1–5 звезд

alter table public.partner_reviews
  add column if not exists rating smallint;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'partner_reviews_rating_1_5'
      and conrelid = 'public.partner_reviews'::regclass
  ) then
    alter table public.partner_reviews
      add constraint partner_reviews_rating_1_5
      check (rating is null or rating between 1 and 5);
  end if;
end $$;

drop policy if exists "partner_reviews_insert_own" on public.partner_reviews;
create policy "partner_reviews_insert_own"
on public.partner_reviews for insert
to authenticated
with check (
  user_id = auth.uid()
  and (rating is null or rating between 1 and 5)
);

drop policy if exists "partner_reviews_update_own_or_admin" on public.partner_reviews;
create policy "partner_reviews_update_own_or_admin"
on public.partner_reviews for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (
  (user_id = auth.uid() or public.is_admin())
  and (rating is null or rating between 1 and 5)
);
