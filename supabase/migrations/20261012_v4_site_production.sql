-- Lot 6 — Atelier de production (additive)
-- NE PAS exécuter automatiquement. Appliquer manuellement après validation.
-- Ne modifie aucun tarif catalogue. Ne touche pas aux snapshots de devis émis.

-- Fiches de production liées aux projets existants
create table if not exists public.site_production_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete set null,
  configuration_id uuid,
  accepted_quote_id uuid,
  prep_status text not null default 'to_prepare'
    check (prep_status in (
      'to_prepare',
      'content_incomplete',
      'ready_to_generate',
      'to_review',
      'client_validation',
      'ready_to_deliver',
      'delivered'
    )),
  content_json jsonb not null default '{}'::jsonb,
  hosting_json jsonb not null default '{"clientOwnsHosting":true}'::jsonb,
  validation_internal boolean not null default false,
  validation_client boolean not null default false,
  last_generation_at timestamptz,
  is_test_fixture boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_production_jobs_project_idx
  on public.site_production_jobs (project_id);

-- Comptes rendus de rendez-vous (privés par défaut)
create table if not exists public.site_meeting_notes (
  id uuid primary key default gen_random_uuid(),
  production_job_id uuid not null references public.site_production_jobs (id) on delete cascade,
  title text not null default 'Compte rendu',
  meeting_date date,
  body text not null default '',
  internal_notes text not null default '',
  status text not null default 'draft' check (status in ('draft', 'validated')),
  share_with_client boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Historique de génération (reproductibilité)
create table if not exists public.site_generation_runs (
  id uuid primary key default gen_random_uuid(),
  production_job_id uuid not null references public.site_production_jobs (id) on delete cascade,
  template_version text not null,
  config_version text not null,
  modules text[] not null default '{}',
  result text not null check (result in ('success', 'failure')),
  error_message text,
  output_dir text,
  superseded boolean not null default false,
  generated_at timestamptz not null default now(),
  generated_by uuid references auth.users (id) on delete set null
);

alter table public.site_production_jobs enable row level security;
alter table public.site_meeting_notes enable row level security;
alter table public.site_generation_runs enable row level security;

-- Admin uniquement (réutilise is_admin si présent)
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_admin'
  ) then
    create policy site_production_jobs_admin on public.site_production_jobs
      for all using (public.is_admin()) with check (public.is_admin());
    create policy site_meeting_notes_admin on public.site_meeting_notes
      for all using (public.is_admin()) with check (public.is_admin());
    create policy site_generation_runs_admin on public.site_generation_runs
      for all using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

comment on table public.site_production_jobs is 'Atelier production lot 6 — ne remplace pas projects';
comment on table public.site_meeting_notes is 'CR rendez-vous privés ; partage client explicite uniquement';
comment on table public.site_generation_runs is 'Historique génération locale / future CI';
