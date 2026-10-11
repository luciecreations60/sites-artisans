-- V4 Lot 6 — Atelier de production (additive)
-- Timestamp Supabase CLI : 20261012140100 (après 20261012140000_v4_commercial_quotes)
-- NE PAS exécuter automatiquement. Appliquer manuellement après le lot 5.
-- Ne modifie aucun tarif catalogue. Ne touche pas aux snapshots de devis émis.

-- ═══════════════════════════════════════════════════════════════════════════
-- Prérequis durs
-- ═══════════════════════════════════════════════════════════════════════════
do $$
begin
  if to_regprocedure('public.is_admin()') is null then
    raise exception
      'Prérequis manquant : public.is_admin() returns boolean (sans argument). Migration portal requise.';
  end if;
  if to_regprocedure('public.set_updated_at()') is null then
    raise exception 'Prérequis manquant : public.set_updated_at()';
  end if;
  if to_regclass('public.projects') is null then
    raise exception 'Prérequis manquant : public.projects';
  end if;
  if to_regclass('public.site_configurations') is null then
    raise exception
      'Prérequis manquant : public.site_configurations — appliquer d’abord 20261012140000_v4_commercial_quotes';
  end if;
  if to_regclass('public.quotes') is null then
    raise exception
      'Prérequis manquant : public.quotes — appliquer d’abord 20261012140000_v4_commercial_quotes';
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Tables
-- ═══════════════════════════════════════════════════════════════════════════

-- project_id : ON DELETE RESTRICT — ne pas orpheliner / effacer une fiche liée
-- configuration_id / accepted_quote_id : FK réelles + validation croisée (trigger)
create table if not exists public.site_production_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete restrict,
  configuration_id uuid references public.site_configurations (id) on delete restrict,
  accepted_quote_id uuid references public.quotes (id) on delete restrict,
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
  -- Fixtures TEST locales / seed : contournent le devis accepté (jamais pour clients réels)
  is_test_fixture boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Cohérence fixture : soit 100 % test (ids null), soit production réelle (ids renseignés)
  constraint site_production_jobs_fixture_or_live check (
    (
      is_test_fixture = true
      and project_id is null
      and configuration_id is null
      and accepted_quote_id is null
    )
    or (
      is_test_fixture = false
      and project_id is not null
      and configuration_id is not null
      and accepted_quote_id is not null
    )
  )
);

-- Une seule fiche de production réelle par projet
create unique index if not exists site_production_jobs_one_live_per_project
  on public.site_production_jobs (project_id)
  where is_test_fixture = false and project_id is not null;

create index if not exists site_production_jobs_project_idx
  on public.site_production_jobs (project_id);
create index if not exists site_production_jobs_quote_idx
  on public.site_production_jobs (accepted_quote_id);
create index if not exists site_production_jobs_config_idx
  on public.site_production_jobs (configuration_id);

-- Comptes rendus — privés admin. share_with_client n’ouvre PAS internal_notes
-- (aucune policy client dans cette migration ; drapeaux pour usage futur).
create table if not exists public.site_meeting_notes (
  id uuid primary key default gen_random_uuid(),
  production_job_id uuid not null references public.site_production_jobs (id) on delete restrict,
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

create index if not exists site_meeting_notes_job_idx
  on public.site_meeting_notes (production_job_id);

-- Historique de génération — RESTRICT pour ne pas perdre l’historique d’un site
create table if not exists public.site_generation_runs (
  id uuid primary key default gen_random_uuid(),
  production_job_id uuid not null references public.site_production_jobs (id) on delete restrict,
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

create index if not exists site_generation_runs_job_idx
  on public.site_generation_runs (production_job_id, generated_at desc);

-- ═══════════════════════════════════════════════════════════════════════════
-- Validation serveur : devis accepté + même projet / configuration
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.enforce_site_production_job()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cfg public.site_configurations%rowtype;
  v_quote public.quotes%rowtype;
begin
  if TG_OP = 'DELETE' then
    if OLD.prep_status = 'delivered' then
      raise exception 'Suppression interdite — fiche de production livrée';
    end if;
    if exists (
      select 1 from public.site_generation_runs r
      where r.production_job_id = OLD.id
    ) then
      raise exception
        'Suppression interdite — historique de génération présent (conserver les runs ou les archiver explicitement)';
    end if;
    if exists (
      select 1 from public.site_meeting_notes n
      where n.production_job_id = OLD.id
    ) then
      raise exception
        'Suppression interdite — comptes rendus présents (supprimer ou archiver les notes d’abord)';
    end if;
    return OLD;
  end if;

  -- Fixtures TEST : aucune contrainte devis (génération locale uniquement)
  if NEW.is_test_fixture then
    if NEW.project_id is not null
       or NEW.configuration_id is not null
       or NEW.accepted_quote_id is not null
    then
      raise exception
        'Fixture TEST — project_id, configuration_id et accepted_quote_id doivent rester NULL';
    end if;
    return NEW;
  end if;

  -- Production réelle
  if NEW.project_id is null or NEW.configuration_id is null or NEW.accepted_quote_id is null then
    raise exception 'Production réelle — projet, configuration et devis accepté obligatoires';
  end if;

  select * into v_cfg
  from public.site_configurations
  where id = NEW.configuration_id;
  if not found then
    raise exception 'Configuration introuvable';
  end if;
  if v_cfg.project_id is distinct from NEW.project_id then
    raise exception 'Configuration liée à un autre projet — production refusée';
  end if;

  select * into v_quote
  from public.quotes
  where id = NEW.accepted_quote_id;
  if not found then
    raise exception 'Devis introuvable';
  end if;

  if v_quote.kind is distinct from 'issued'
     or v_quote.status is distinct from 'accepted'
     or coalesce(v_quote.locked, false) is not true
  then
    raise exception
      'Devis non éligible à la production — requis : kind=issued, status=accepted, locked=true (envoyé/refusé/simulation insuffisants)';
  end if;

  if v_quote.project_id is distinct from NEW.project_id then
    raise exception 'Devis appartenant à un autre projet — production refusée';
  end if;

  if v_quote.configuration_id is not null
     and v_quote.configuration_id is distinct from NEW.configuration_id
  then
    raise exception 'Devis lié à une autre configuration — production refusée';
  end if;

  return NEW;
end;
$$;

revoke all on function public.enforce_site_production_job() from public;
revoke all on function public.enforce_site_production_job() from anon, authenticated;

drop trigger if exists site_production_jobs_enforce on public.site_production_jobs;
create trigger site_production_jobs_enforce
  before insert or update or delete on public.site_production_jobs
  for each row execute function public.enforce_site_production_job();

-- Empêcher de marquer « delivered » sans au moins une génération réussie
create or replace function public.enforce_production_delivered()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.prep_status = 'delivered'
     and (TG_OP = 'INSERT' or OLD.prep_status is distinct from 'delivered')
     and not NEW.is_test_fixture
  then
    if not exists (
      select 1 from public.site_generation_runs r
      where r.production_job_id = NEW.id
        and r.result = 'success'
    ) then
      raise exception
        'Statut delivered interdit sans génération réussie enregistrée';
    end if;
  end if;
  return NEW;
end;
$$;

revoke all on function public.enforce_production_delivered() from public;
revoke all on function public.enforce_production_delivered() from anon, authenticated;

drop trigger if exists site_production_jobs_delivered on public.site_production_jobs;
create trigger site_production_jobs_delivered
  before insert or update of prep_status on public.site_production_jobs
  for each row execute function public.enforce_production_delivered();

-- updated_at
drop trigger if exists site_production_jobs_set_updated_at on public.site_production_jobs;
create trigger site_production_jobs_set_updated_at
  before update on public.site_production_jobs
  for each row execute function public.set_updated_at();

drop trigger if exists site_meeting_notes_set_updated_at on public.site_meeting_notes;
create trigger site_meeting_notes_set_updated_at
  before update on public.site_meeting_notes
  for each row execute function public.set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS — administrateurs uniquement (réexécution contrôlée)
-- Aucun accès client / anon : share_with_client ne crée pas de policy ici.
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.site_production_jobs enable row level security;
alter table public.site_meeting_notes enable row level security;
alter table public.site_generation_runs enable row level security;

drop policy if exists site_production_jobs_admin on public.site_production_jobs;
create policy site_production_jobs_admin on public.site_production_jobs
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists site_meeting_notes_admin on public.site_meeting_notes;
create policy site_meeting_notes_admin on public.site_meeting_notes
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists site_generation_runs_admin on public.site_generation_runs;
create policy site_generation_runs_admin on public.site_generation_runs
  for all
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.site_production_jobs to authenticated;
grant select, insert, update, delete on public.site_meeting_notes to authenticated;
grant select, insert, update, delete on public.site_generation_runs to authenticated;
grant all on public.site_production_jobs to service_role;
grant all on public.site_meeting_notes to service_role;
grant all on public.site_generation_runs to service_role;

comment on table public.site_production_jobs is
  'Atelier production lot 6 — une fiche live / projet ; fixtures TEST isolées (is_test_fixture)';
comment on table public.site_meeting_notes is
  'CR rendez-vous admin-only ; share_with_client n’expose pas internal_notes';
comment on table public.site_generation_runs is
  'Historique générations — ON DELETE RESTRICT depuis la fiche';
comment on function public.enforce_site_production_job() is
  'Valide issued+accepted+locked et cohérence projet/config/devis ; fixtures TEST exemptées';
comment on column public.site_meeting_notes.share_with_client is
  'Drapeau futur — ne donne aucun accès RLS dans cette migration ; ne jamais exposer internal_notes';
comment on column public.site_production_jobs.is_test_fixture is
  'true = simulation locale sans devis ; false = production réelle sous contrôle serveur';
