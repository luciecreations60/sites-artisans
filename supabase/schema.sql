-- Espace client Sites Artisans (Supabase)
-- À appliquer après création du projet Supabase.
-- Lancement public prévu : 01/01/2027.
-- Factures Indy : dépôt manuel (pas d'API Indy).

-- Rôles
create type public.app_role as enum ('admin', 'client');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'client',
  full_name text,
  company_name text,
  phone text,
  created_at timestamptz not null default now()
);

create table public.projects (
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

create table public.project_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  label text not null,
  detail text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  kind text not null check (kind in ('devis', 'facture', 'contrat', 'brief', 'autre')),
  title text not null,
  storage_path text not null,
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  label text not null,
  done boolean not null default false,
  due_date date,
  sort_order int not null default 0
);

create table public.change_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text not null,
  status text not null default 'ouvert'
    check (status in ('ouvert', 'en_cours', 'termine', 'refuse')),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.maintenance_quotas (
  project_id uuid primary key references public.projects (id) on delete cascade,
  hours_included numeric(6,1) not null default 1.0,
  hours_used numeric(6,1) not null default 0.0,
  period_start date not null default date_trunc('month', now())::date
);

-- Storage bucket (à créer aussi dans le dashboard) : project-docs

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_events enable row level security;
alter table public.documents enable row level security;
alter table public.checklist_items enable row level security;
alter table public.change_requests enable row level security;
alter table public.maintenance_quotas enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Clients : accès à leur profil + leurs projets
create policy profiles_self on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy profiles_self_update on public.profiles
  for update using (id = auth.uid() or public.is_admin());

create policy projects_client_select on public.projects
  for select using (client_id = auth.uid() or public.is_admin());

create policy projects_admin_write on public.projects
  for all using (public.is_admin());

create policy events_select on public.project_events
  for select using (
    public.is_admin()
    or exists (select 1 from public.projects pr where pr.id = project_id and pr.client_id = auth.uid())
  );

create policy documents_select on public.documents
  for select using (
    public.is_admin()
    or exists (select 1 from public.projects pr where pr.id = project_id and pr.client_id = auth.uid())
  );

create policy checklist_select on public.checklist_items
  for select using (
    public.is_admin()
    or exists (select 1 from public.projects pr where pr.id = project_id and pr.client_id = auth.uid())
  );

create policy change_requests_client on public.change_requests
  for all using (
    public.is_admin()
    or exists (select 1 from public.projects pr where pr.id = project_id and pr.client_id = auth.uid())
  );

create policy quotas_select on public.maintenance_quotas
  for select using (
    public.is_admin()
    or exists (select 1 from public.projects pr where pr.id = project_id and pr.client_id = auth.uid())
  );
