create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  trip_date date not null,
  amount numeric(10,2) not null check (amount >= 0),
  description text not null default '',
  departed_at timestamptz not null default now(),
  period text not null check (period in ('manha', 'tarde', 'noite')),
  status text not null default 'open' check (status in ('open', 'registered')),
  completed boolean not null default false,
  paid boolean not null default false,
  registered_at timestamptz,
  next_reminder_at timestamptz,
  created_at timestamptz not null default now(),
  constraint registered_requires_completed check (status = 'open' or completed)
);

create index trips_user_date_idx on public.trips (user_id, trip_date);
create index trips_user_status_idx on public.trips (user_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;

alter table public.trips enable row level security;

create policy "trips_select_own" on public.trips
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "trips_insert_own" on public.trips
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "trips_update_own" on public.trips
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "trips_delete_own" on public.trips
  for delete to authenticated using ((select auth.uid()) = user_id);