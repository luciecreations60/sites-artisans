-- Espace client Sites Artisans (Supabase)
-- 1) Créer un projet Supabase (ou réutiliser le vôtre)
-- 2) SQL Editor → coller ce fichier → Run
-- 3) Storage → New bucket "project-docs" (privé)
-- 4) Auth → créer un utilisateur client, puis profiles.role = 'client'
--    Pour vous : profiles.role = 'admin'
-- Factures Indy : upload manuel dans Storage (pas d'API Indy).

create extension if not exists "pgcrypto";

do $$ begin
  create type public.app_role as enum ('admin', 'client');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'client',
  full_name text,
  company_name text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  trade_slug text,
  offer_tier text check (offer_tier in ('essentiel', 'avance', 'pro')),
  status text not null default 'brief'
    check (status in ('brief', 'design', 'contenu', 'recette', 'en_ligne', 'maintenance')),
  domain text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  label text not null,
  detail text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  kind text not null check (kind in ('devis', 'facture', 'contrat', 'brief', 'autre')),
  title text not null,
  storage_path text not null,
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  label text not null,
  done boolean not null default false,
  due_date date,
  sort_order int not null default 0
);

create table if not exists public.change_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text not null,
  status text not null default 'ouvert'
    check (status in ('ouvert', 'en_cours', 'termine', 'refuse')),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.maintenance_quotas (
  project_id uuid primary key references public.projects (id) on delete cascade,
  hours_included numeric(6,1) not null default 1.0,
  hours_used numeric(6,1) not null default 0.0,
  period_start date not null default (date_trunc('month', now()))::date
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.owns_project(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects pr
    where pr.id = pid and pr.client_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_events enable row level security;
alter table public.documents enable row level security;
alter table public.checklist_items enable row level security;
alter table public.change_requests enable row level security;
alter table public.maintenance_quotas enable row level security;

drop policy if exists profiles_self on public.profiles;
drop policy if exists profiles_self_update on public.profiles;
drop policy if exists profiles_admin_all on public.profiles;
drop policy if exists projects_client_select on public.projects;
drop policy if exists projects_admin_write on public.projects;
drop policy if exists events_select on public.project_events;
drop policy if exists events_admin_write on public.project_events;
drop policy if exists documents_select on public.documents;
drop policy if exists documents_admin_write on public.documents;
drop policy if exists checklist_select on public.checklist_items;
drop policy if exists checklist_admin_write on public.checklist_items;
drop policy if exists change_requests_client on public.change_requests;
drop policy if exists quotas_select on public.maintenance_quotas;
drop policy if exists quotas_admin_write on public.maintenance_quotas;

create policy profiles_self on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy profiles_self_update on public.profiles
  for update using (id = auth.uid() or public.is_admin());

create policy profiles_admin_all on public.profiles
  for all using (public.is_admin());

create policy projects_client_select on public.projects
  for select using (client_id = auth.uid() or public.is_admin());

create policy projects_admin_write on public.projects
  for all using (public.is_admin()) with check (public.is_admin());

create policy events_select on public.project_events
  for select using (public.is_admin() or public.owns_project(project_id));

create policy events_admin_write on public.project_events
  for all using (public.is_admin()) with check (public.is_admin());

create policy documents_select on public.documents
  for select using (public.is_admin() or public.owns_project(project_id));

create policy documents_admin_write on public.documents
  for all using (public.is_admin()) with check (public.is_admin());

create policy checklist_select on public.checklist_items
  for select using (public.is_admin() or public.owns_project(project_id));

create policy checklist_admin_write on public.checklist_items
  for all using (public.is_admin()) with check (public.is_admin());

create policy change_requests_client on public.change_requests
  for select using (public.is_admin() or public.owns_project(project_id));

create policy change_requests_client_insert on public.change_requests
  for insert with check (
    public.is_admin()
    or (public.owns_project(project_id) and created_by = auth.uid())
  );

create policy change_requests_admin_update on public.change_requests
  for update using (public.is_admin()) with check (public.is_admin());

create policy quotas_select on public.maintenance_quotas
  for select using (public.is_admin() or public.owns_project(project_id));

create policy quotas_admin_write on public.maintenance_quotas
  for all using (public.is_admin()) with check (public.is_admin());

-- Storage policies (bucket privé project-docs)
-- Créer le bucket dans le dashboard si besoin :
insert into storage.buckets (id, name, public)
values ('project-docs', 'project-docs', false)
on conflict (id) do nothing;

drop policy if exists project_docs_select on storage.objects;
drop policy if exists project_docs_admin_write on storage.objects;

-- Chemins attendus : {project_id}/{filename}
create policy project_docs_select on storage.objects
  for select using (
    bucket_id = 'project-docs'
    and (
      public.is_admin()
      or public.owns_project(((storage.foldername(name))[1])::uuid)
    )
  );

create policy project_docs_admin_write on storage.objects
  for all using (bucket_id = 'project-docs' and public.is_admin())
  with check (bucket_id = 'project-docs' and public.is_admin());
