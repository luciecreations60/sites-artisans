-- Harden portal RLS + minimal schema for Admin / Espace client
-- Compatible with existing data (idempotent where possible).

-- ─── profiles.email (synced from auth) ───────────────────────────────────────
alter table public.profiles
  add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and (p.email is null or p.email = '');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), null),
    new.email
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

create or replace function public.handle_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_update();

-- ─── project_events: visibility client ───────────────────────────────────────
alter table public.project_events
  add column if not exists visible_to_client boolean not null default true;

-- ─── projects: optional target date ──────────────────────────────────────────
alter table public.projects
  add column if not exists target_date date;

-- ─── change_requests: besoin d'information ───────────────────────────────────
alter table public.change_requests drop constraint if exists change_requests_status_check;
alter table public.change_requests
  add constraint change_requests_status_check
  check (status in ('ouvert', 'en_cours', 'besoin_info', 'termine', 'refuse'));

-- ─── Guard: non-admin cannot change role ─────────────────────────────────────
create or replace function public.profiles_guard_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Modification du rôle non autorisée';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.profiles_guard_role();

-- ─── RLS profiles ────────────────────────────────────────────────────────────
drop policy if exists profiles_self on public.profiles;
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_self_update on public.profiles;
drop policy if exists profiles_admin_all on public.profiles;
drop policy if exists profiles_admin_write on public.profiles;

create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy profiles_self_update on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_admin_write on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- Events: clients only see visible events
drop policy if exists events_select on public.project_events;
create policy events_select on public.project_events
  for select using (
    public.is_admin()
    or (
      public.owns_project(project_id)
      and visible_to_client = true
    )
  );

drop policy if exists change_requests_client_insert on public.change_requests;
create policy change_requests_client_insert on public.change_requests
  for insert with check (
    public.is_admin()
    or (public.owns_project(project_id) and created_by = auth.uid())
  );

drop policy if exists change_requests_admin_update on public.change_requests;
create policy change_requests_admin_update on public.change_requests
  for update using (public.is_admin()) with check (public.is_admin());

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();
