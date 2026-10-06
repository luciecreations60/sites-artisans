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
  email text,
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
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  label text not null,
  detail text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  visible_to_client boolean not null default true
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
    check (status in ('ouvert', 'en_cours', 'besoin_info', 'termine', 'refuse')),
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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

create or replace function public.profiles_guard_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Bloque seulement les users authentifiés non-admin (SQL Editor / service_role OK).
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Modification du rôle non autorisée';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.profiles_guard_role();

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
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_self_update on public.profiles;
drop policy if exists profiles_admin_all on public.profiles;
drop policy if exists profiles_admin_write on public.profiles;
drop policy if exists projects_client_select on public.projects;
drop policy if exists projects_admin_write on public.projects;
drop policy if exists events_select on public.project_events;
drop policy if exists events_admin_write on public.project_events;
drop policy if exists documents_select on public.documents;
drop policy if exists documents_admin_write on public.documents;
drop policy if exists checklist_select on public.checklist_items;
drop policy if exists checklist_admin_write on public.checklist_items;
drop policy if exists change_requests_client on public.change_requests;
drop policy if exists change_requests_client_insert on public.change_requests;
drop policy if exists change_requests_admin_update on public.change_requests;
drop policy if exists quotas_select on public.maintenance_quotas;
drop policy if exists quotas_admin_write on public.maintenance_quotas;

create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());

-- Client can update own profile but cannot escalate role
create policy profiles_self_update on public.profiles
  for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

create policy profiles_admin_write on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

create policy projects_client_select on public.projects
  for select using (client_id = auth.uid() or public.is_admin());

create policy projects_admin_write on public.projects
  for all using (public.is_admin()) with check (public.is_admin());

create policy events_select on public.project_events
  for select using (
    public.is_admin()
    or (public.owns_project(project_id) and visible_to_client = true)
  );

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


-- ===========================================================================
-- CRM Phase 1 (also in migrations/20261004_crm_prospects_phase1.sql)
-- ===========================================================================

-- CRM Phase 1 — Prospects (référentiels + prospects + tâches + interactions + tags)
-- Admin only via public.is_admin(). Réutilise public.set_updated_at().

-- ═══════════════════════════════════════════════════════════════════════════
-- Référentiels génériques helper
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.prospect_statuses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  is_closed boolean not null default false,
  is_won boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prospect_sources (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prospect_priorities (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prospect_task_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prospect_interaction_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  is_system boolean not null default false,
  counts_as_contact boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prospect_do_not_contact_reasons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prospect_tags (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Seed référentiels (idempotent)
-- ═══════════════════════════════════════════════════════════════════════════

-- Archivage = prospects.archived_at uniquement (pas un statut commercial)
insert into public.prospect_statuses (code, label, sort_order, is_closed, is_won) values
  ('a_analyser', 'À analyser', 10, false, false),
  ('a_contacter', 'À contacter', 20, false, false),
  ('contacte', 'Contacté', 30, false, false),
  ('a_relancer', 'À relancer', 40, false, false),
  ('interesse', 'Intéressé', 50, false, false),
  ('rendez_vous', 'Rendez-vous', 60, false, false),
  ('devis_a_preparer', 'Devis à préparer', 70, false, false),
  ('devis_envoye', 'Devis envoyé', 80, false, false),
  ('gagne', 'Gagné', 90, true, true),
  ('refuse', 'Refusé', 100, true, false),
  ('sans_reponse', 'Sans réponse', 110, true, false)
on conflict (code) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_closed = excluded.is_closed,
  is_won = excluded.is_won;

insert into public.prospect_sources (code, label, sort_order) values
  ('google_maps', 'Google Maps', 10),
  ('google', 'Google', 20),
  ('recommandation', 'Recommandation', 30),
  ('reseau', 'Réseau', 40),
  ('terrain', 'Prospection terrain', 50),
  ('annuaire', 'Annuaire', 60),
  ('formulaire', 'Formulaire', 70),
  ('autre', 'Autre', 80)
on conflict (code) do update set label = excluded.label, sort_order = excluded.sort_order;

insert into public.prospect_priorities (code, label, sort_order) values
  ('faible', 'Faible', 10),
  ('normale', 'Normale', 20),
  ('haute', 'Haute', 30)
on conflict (code) do update set label = excluded.label, sort_order = excluded.sort_order;

insert into public.prospect_task_types (code, label, sort_order) values
  ('first_contact', 'Premier contact', 10),
  ('follow_up', 'Relance', 20),
  ('phone_call', 'Appel', 30),
  ('prepare_demo', 'Préparer une démo', 40),
  ('prepare_quote', 'Préparer un devis', 50),
  ('meeting', 'Rendez-vous', 60),
  ('other', 'Autre', 70)
on conflict (code) do update set label = excluded.label, sort_order = excluded.sort_order;

insert into public.prospect_interaction_types (code, label, sort_order, is_system, counts_as_contact) values
  ('prospect_created', 'Prospect créé', 10, true, false),
  ('note', 'Note', 20, false, false),
  ('status_changed', 'Changement de statut', 30, true, false),
  ('email', 'E-mail', 40, false, true),
  ('phone_call', 'Appel', 50, false, true),
  ('sms', 'SMS', 60, false, true),
  ('meeting', 'Rendez-vous', 70, false, true),
  ('follow_up', 'Relance', 80, false, true),
  ('demo', 'Démo', 90, false, true),
  ('quote', 'Devis', 100, false, true),
  ('other', 'Autre', 110, false, false),
  ('conversion', 'Conversion client', 120, true, false)
on conflict (code) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_system = excluded.is_system,
  counts_as_contact = excluded.counts_as_contact;

insert into public.prospect_do_not_contact_reasons (code, label, sort_order) values
  ('requested', 'Demande explicite du prospect', 10),
  ('not_relevant', 'Prospect non pertinent', 20),
  ('bad_contact', 'Coordonnées incorrectes', 30),
  ('duplicate', 'Doublon', 40),
  ('other', 'Autre', 50)
on conflict (code) do update set label = excluded.label, sort_order = excluded.sort_order;

insert into public.prospect_tags (code, label, sort_order) values
  ('bon_potentiel', 'Bon potentiel', 10),
  ('prioritaire', 'Prioritaire', 20),
  ('a_rappeler', 'À rappeler', 30),
  ('local', 'Local', 40),
  ('a_surveiller', 'À surveiller', 50)
on conflict (code) do update set label = excluded.label, sort_order = excluded.sort_order;

-- ═══════════════════════════════════════════════════════════════════════════
-- Prospects
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  commercial_name text,
  trade_slug text,
  specialty text,
  contact_first_name text,
  contact_last_name text,
  contact_role text,
  email text,
  phone text,
  address text,
  postal_code text,
  city text,
  department text,
  service_area text,
  website_url text,
  google_business_url text,
  facebook_url text,
  instagram_url text,
  linkedin_url text,
  status_id uuid not null references public.prospect_statuses (id),
  priority_id uuid not null references public.prospect_priorities (id),
  source_id uuid references public.prospect_sources (id),
  analysis_flags text[] not null default '{}',
  analysis_notes text,
  internal_notes text,
  do_not_contact boolean not null default false,
  do_not_contact_reason_id uuid references public.prospect_do_not_contact_reasons (id),
  do_not_contact_note text,
  do_not_contact_at timestamptz,
  do_not_contact_by uuid references public.profiles (id),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.prospect_tag_links (
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  tag_id uuid not null references public.prospect_tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (prospect_id, tag_id)
);

create table if not exists public.prospect_tasks (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  task_type_id uuid not null references public.prospect_task_types (id),
  title text not null,
  detail text,
  due_at timestamptz not null,
  completed_at timestamptz,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prospect_interactions (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  interaction_type_id uuid not null references public.prospect_interaction_types (id),
  title text,
  detail text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- Defaults status / priority on insert
create or replace function public.prospects_set_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status_id is null then
    select id into new.status_id from public.prospect_statuses where code = 'a_analyser' limit 1;
  end if;
  if new.priority_id is null then
    select id into new.priority_id from public.prospect_priorities where code = 'normale' limit 1;
  end if;
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists prospects_set_defaults on public.prospects;
create trigger prospects_set_defaults
  before insert on public.prospects
  for each row execute function public.prospects_set_defaults();

-- Auto interaction on create + status change
create or replace function public.prospects_log_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type uuid;
  v_old_label text;
  v_new_label text;
begin
  if tg_op = 'INSERT' then
    select id into v_type from public.prospect_interaction_types where code = 'prospect_created' limit 1;
    if v_type is not null then
      insert into public.prospect_interactions (prospect_id, interaction_type_id, title, created_by)
      values (new.id, v_type, 'Prospect créé', coalesce(new.created_by, auth.uid()));
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' and new.status_id is distinct from old.status_id then
    select id into v_type from public.prospect_interaction_types where code = 'status_changed' limit 1;
    select label into v_old_label from public.prospect_statuses where id = old.status_id;
    select label into v_new_label from public.prospect_statuses where id = new.status_id;
    if v_type is not null then
      insert into public.prospect_interactions (prospect_id, interaction_type_id, title, detail, created_by)
      values (
        new.id,
        v_type,
        'Changement de statut',
        coalesce(v_old_label, '?') || ' → ' || coalesce(v_new_label, '?'),
        auth.uid()
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists prospects_log_lifecycle on public.prospects;
create trigger prospects_log_lifecycle
  after insert or update on public.prospects
  for each row execute function public.prospects_log_lifecycle();

-- updated_at triggers (reuse set_updated_at)
drop trigger if exists prospect_statuses_updated_at on public.prospect_statuses;
create trigger prospect_statuses_updated_at
  before update on public.prospect_statuses
  for each row execute function public.set_updated_at();

drop trigger if exists prospect_sources_updated_at on public.prospect_sources;
create trigger prospect_sources_updated_at
  before update on public.prospect_sources
  for each row execute function public.set_updated_at();

drop trigger if exists prospect_priorities_updated_at on public.prospect_priorities;
create trigger prospect_priorities_updated_at
  before update on public.prospect_priorities
  for each row execute function public.set_updated_at();

drop trigger if exists prospect_task_types_updated_at on public.prospect_task_types;
create trigger prospect_task_types_updated_at
  before update on public.prospect_task_types
  for each row execute function public.set_updated_at();

drop trigger if exists prospect_interaction_types_updated_at on public.prospect_interaction_types;
create trigger prospect_interaction_types_updated_at
  before update on public.prospect_interaction_types
  for each row execute function public.set_updated_at();

drop trigger if exists prospect_dnc_reasons_updated_at on public.prospect_do_not_contact_reasons;
create trigger prospect_dnc_reasons_updated_at
  before update on public.prospect_do_not_contact_reasons
  for each row execute function public.set_updated_at();

drop trigger if exists prospect_tags_updated_at on public.prospect_tags;
create trigger prospect_tags_updated_at
  before update on public.prospect_tags
  for each row execute function public.set_updated_at();

drop trigger if exists prospects_updated_at on public.prospects;
create trigger prospects_updated_at
  before update on public.prospects
  for each row execute function public.set_updated_at();

drop trigger if exists prospect_tasks_updated_at on public.prospect_tasks;
create trigger prospect_tasks_updated_at
  before update on public.prospect_tasks
  for each row execute function public.set_updated_at();

-- Indexes
create index if not exists prospects_status_id_idx on public.prospects (status_id);
create index if not exists prospects_priority_id_idx on public.prospects (priority_id);
create index if not exists prospects_source_id_idx on public.prospects (source_id);
create index if not exists prospects_trade_slug_idx on public.prospects (trade_slug);
create index if not exists prospects_city_idx on public.prospects (city);
create index if not exists prospects_created_at_idx on public.prospects (created_at desc);
create index if not exists prospects_archived_at_idx on public.prospects (archived_at);
create index if not exists prospects_do_not_contact_idx on public.prospects (do_not_contact);
create index if not exists prospect_tasks_prospect_id_idx on public.prospect_tasks (prospect_id);
create index if not exists prospect_tasks_due_at_idx on public.prospect_tasks (due_at);
create index if not exists prospect_tasks_completed_at_idx on public.prospect_tasks (completed_at);
create index if not exists prospect_interactions_prospect_id_idx on public.prospect_interactions (prospect_id);
create index if not exists prospect_interactions_created_at_idx on public.prospect_interactions (created_at desc);
create index if not exists prospect_tag_links_prospect_id_idx on public.prospect_tag_links (prospect_id);
create index if not exists prospect_tag_links_tag_id_idx on public.prospect_tag_links (tag_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS — admin only
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.prospect_statuses enable row level security;
alter table public.prospect_sources enable row level security;
alter table public.prospect_priorities enable row level security;
alter table public.prospect_task_types enable row level security;
alter table public.prospect_interaction_types enable row level security;
alter table public.prospect_do_not_contact_reasons enable row level security;
alter table public.prospect_tags enable row level security;
alter table public.prospects enable row level security;
alter table public.prospect_tag_links enable row level security;
alter table public.prospect_tasks enable row level security;
alter table public.prospect_interactions enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'prospect_statuses',
    'prospect_sources',
    'prospect_priorities',
    'prospect_task_types',
    'prospect_interaction_types',
    'prospect_do_not_contact_reasons',
    'prospect_tags',
    'prospects',
    'prospect_tag_links',
    'prospect_tasks',
    'prospect_interactions'
  ]
  loop
    execute format('drop policy if exists %I_admin_all on public.%I', t, t);
    execute format(
      'create policy %I_admin_all on public.%I for all using (public.is_admin()) with check (public.is_admin())',
      t, t
    );
  end loop;
end $$;

-- CRM Phase 3 (e-mails / campagnes) : voir migrations/20261006_crm_prospect_emails_phase3.sql et EMAIL.md

