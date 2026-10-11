-- V4 Lot 5 — Configurations, demandes commerciales, devis (additive)
-- Prérequis déjà appliqués : CRM prospects (20261004+), portal (is_admin, owns_project, set_updated_at),
--   idéalement catalogue 20261011 (sinon l’Edge Function renverra migration_pending).
-- Ne modifie PAS les migrations antérieures ni les tarifs catalogue.
-- À appliquer manuellement ; non exécutée automatiquement en production.

-- ═══════════════════════════════════════════════════════════════════════════
-- Dépendances attendues (uuid PK)
--   public.prospects(id uuid)
--   public.projects(id uuid)
--   public.prospect_sources(code text unique)
--   public.is_admin(), public.owns_project(uuid), public.set_updated_at()
-- ═══════════════════════════════════════════════════════════════════════════

-- Source CRM
insert into public.prospect_sources (code, label, sort_order) values
  ('configurateur_v4', 'Configurateur V4', 75)
on conflict (code) do update set label = excluded.label, sort_order = excluded.sort_order;

-- Paramètres fiscaux / légaux de l’émetteur (admin)
create table if not exists public.business_settings (
  id text primary key default 'default',
  legal_name text,
  trade_name text,
  address_line text,
  postal_code text,
  city text,
  email text,
  phone text,
  siret text,
  vat_number text,
  tax_regime text not null default 'unknown'
    check (tax_regime in ('franchise', 'liable', 'unknown')),
  vat_rate_bps integer check (vat_rate_bps is null or (vat_rate_bps >= 0 and vat_rate_bps <= 10000)),
  payment_terms text,
  quote_validity_days integer not null default 30
    check (quote_validity_days > 0 and quote_validity_days <= 365),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

insert into public.business_settings (id, tax_regime)
values ('default', 'unknown')
on conflict (id) do nothing;

alter table public.business_settings enable row level security;

drop policy if exists business_settings_admin_all on public.business_settings;
create policy business_settings_admin_all on public.business_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- Configuration site (snapshot pour lot 6)
create table if not exists public.site_configurations (
  id uuid primary key default gen_random_uuid(),
  format_version integer not null default 1,
  client_local_id text,
  trade_slug text,
  plan_id text,
  path text check (path is null or path in ('formula', 'compose')),
  company_name text,
  city text,
  specialty text,
  theme_id text,
  font_id text,
  desired_feature_ids text[] not null default '{}',
  feature_quantities jsonb not null default '{}'::jsonb,
  profile_snapshot jsonb not null default '{}'::jsonb,
  catalog_source text not null default 'unknown'
    check (catalog_source in ('supabase', 'static', 'unknown')),
  catalog_fingerprint text,
  pricing_snapshot jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'archived')),
  prospect_id uuid references public.prospects (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  anonymized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_configurations_prospect_idx
  on public.site_configurations (prospect_id);
create index if not exists site_configurations_client_local_idx
  on public.site_configurations (client_local_id);

alter table public.site_configurations enable row level security;

drop policy if exists site_configurations_admin_all on public.site_configurations;
create policy site_configurations_admin_all on public.site_configurations
  for all using (public.is_admin()) with check (public.is_admin());

-- Demande commerciale
-- prospect_id nullable + ON DELETE SET NULL : conserver l’historique si le prospect
-- est anonymisé / supprimé (pas de CASCADE destructeur).
create table if not exists public.commercial_requests (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null unique,
  client_request_id text,
  prospect_id uuid references public.prospects (id) on delete set null,
  configuration_id uuid references public.site_configurations (id) on delete set null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  company_name text,
  message text,
  contact_preference text
    check (contact_preference is null or contact_preference in ('email', 'phone', 'either')),
  source_code text not null default 'configurateur_v4',
  server_creation_cents integer,
  server_recurring_cents integer,
  server_pricing_complete boolean not null default false,
  server_pricing_snapshot jsonb,
  client_claimed_creation_cents integer,
  price_differs_from_client boolean not null default false,
  status text not null default 'received'
    check (status in ('received', 'linked', 'archived')),
  ip_hash text,
  user_agent text,
  anonymized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists commercial_requests_client_request_uidx
  on public.commercial_requests (client_request_id)
  where client_request_id is not null;

create index if not exists commercial_requests_prospect_idx
  on public.commercial_requests (prospect_id);

alter table public.commercial_requests enable row level security;

drop policy if exists commercial_requests_admin_all on public.commercial_requests;
create policy commercial_requests_admin_all on public.commercial_requests
  for all using (public.is_admin()) with check (public.is_admin());

-- Anti-spam (écriture via service_role / RPC SECURITY DEFINER uniquement)
create table if not exists public.commercial_request_rate_limits (
  bucket_key text primary key,
  hit_count integer not null default 0,
  window_started_at timestamptz not null default now()
);

alter table public.commercial_request_rate_limits enable row level security;
-- Aucune policy : anon/authenticated ne lisent ni n’écrivent.
-- service_role bypasse RLS. RPC claim_commercial_rate_limit pour atomicité.

create or replace function public.claim_commercial_rate_limit(
  p_bucket_key text,
  p_limit integer default 8,
  p_window_seconds integer default 3600
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.commercial_request_rate_limits%rowtype;
  v_now timestamptz := now();
begin
  if p_bucket_key is null or length(p_bucket_key) < 8 then
    return false;
  end if;
  if p_limit < 1 or p_window_seconds < 60 then
    return false;
  end if;

  insert into public.commercial_request_rate_limits (bucket_key, hit_count, window_started_at)
  values (p_bucket_key, 1, v_now)
  on conflict (bucket_key) do nothing;

  select * into v_row
  from public.commercial_request_rate_limits
  where bucket_key = p_bucket_key
  for update;

  if v_row.window_started_at + make_interval(secs => p_window_seconds) <= v_now then
    update public.commercial_request_rate_limits
    set hit_count = 1, window_started_at = v_now
    where bucket_key = p_bucket_key;
    return true;
  end if;

  if v_row.hit_count >= p_limit then
    return false;
  end if;

  update public.commercial_request_rate_limits
  set hit_count = hit_count + 1
  where bucket_key = p_bucket_key;
  return true;
end;
$$;

revoke all on function public.claim_commercial_rate_limit(text, integer, integer) from public;
grant execute on function public.claim_commercial_rate_limit(text, integer, integer) to service_role;

-- Numérotation devis (unique)
create sequence if not exists public.quote_reference_seq;

-- Devis
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  reference text,
  kind text not null default 'simulation'
    check (kind in ('simulation', 'draft', 'issued')),
  status text not null default 'open'
    check (status in ('open', 'sent', 'accepted', 'refused', 'cancelled', 'superseded')),
  prospect_id uuid references public.prospects (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  configuration_id uuid references public.site_configurations (id) on delete set null,
  commercial_request_id uuid references public.commercial_requests (id) on delete set null,
  trade_slug text,
  plan_id text,
  currency text not null default 'EUR',
  creation_ht_cents integer not null default 0,
  creation_vat_cents integer,
  creation_ttc_cents integer,
  recurring_cents integer not null default 0,
  tax_regime text not null default 'unknown'
    check (tax_regime in ('franchise', 'liable', 'unknown')),
  vat_rate_bps integer,
  pricing_complete boolean not null default false,
  catalog_fingerprint text,
  lines_snapshot jsonb not null default '[]'::jsonb,
  pricing_snapshot jsonb not null default '{}'::jsonb,
  issuer_snapshot jsonb not null default '{}'::jsonb,
  client_snapshot jsonb not null default '{}'::jsonb,
  notes text,
  valid_until date,
  issued_at timestamptz,
  issued_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  locked boolean not null default false,
  -- Un devis émis est forcément verrouillé
  constraint quotes_issued_must_be_locked check (kind <> 'issued' or locked = true)
);

create unique index if not exists quotes_reference_uidx
  on public.quotes (reference)
  where reference is not null;

create index if not exists quotes_prospect_idx on public.quotes (prospect_id);
create index if not exists quotes_project_idx on public.quotes (project_id);

alter table public.quotes enable row level security;

drop policy if exists quotes_admin_all on public.quotes;
create policy quotes_admin_all on public.quotes
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists quotes_client_select on public.quotes;
create policy quotes_client_select on public.quotes
  for select using (
    project_id is not null
    and public.owns_project(project_id)
    and kind = 'issued'
  );

-- Historique des changements de statut commercial
create table if not exists public.quote_status_events (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references auth.users (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists quote_status_events_quote_idx
  on public.quote_status_events (quote_id, created_at desc);

alter table public.quote_status_events enable row level security;

drop policy if exists quote_status_events_admin_all on public.quote_status_events;
create policy quote_status_events_admin_all on public.quote_status_events
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists quote_status_events_client_select on public.quote_status_events;
create policy quote_status_events_client_select on public.quote_status_events
  for select using (
    exists (
      select 1 from public.quotes q
      where q.id = quote_id
        and q.kind = 'issued'
        and q.project_id is not null
        and public.owns_project(q.project_id)
    )
  );

-- Transitions de statut autorisées (miroir TypeScript : quoteStatus.ts)
create or replace function public.quote_status_transition_allowed(
  p_from text,
  p_to text
)
returns boolean
language sql
immutable
as $$
  select case
    when p_from is not distinct from p_to then true
    when p_from = 'open' and p_to in ('sent', 'cancelled') then true
    when p_from = 'sent' and p_to in ('accepted', 'refused', 'cancelled', 'superseded') then true
    when p_from = 'accepted' and p_to in ('cancelled', 'superseded') then true
    when p_from = 'refused' and p_to in ('superseded') then true
    when p_from = 'cancelled' and p_to in ('superseded') then true
    else false
  end;
$$;

-- Génération de référence unique D-YYYYMMDD-NNNNNN
create or replace function public.next_quote_reference()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n bigint;
begin
  v_n := nextval('public.quote_reference_seq');
  return 'D-' || to_char(timezone('utc', now()), 'YYYYMMDD') || '-' || lpad(v_n::text, 6, '0');
end;
$$;

revoke all on function public.next_quote_reference() from public;
grant execute on function public.next_quote_reference() to authenticated;
grant execute on function public.next_quote_reference() to service_role;

-- Garde-fou devis : immuabilité contractuelle + transitions de statut
create or replace function public.enforce_quote_immutability()
returns trigger
language plpgsql
as $$
declare
  v_actor uuid := auth.uid();
  v_was_locked boolean := coalesce(OLD.locked, false) or OLD.kind = 'issued';
  v_issuing boolean := NEW.kind = 'issued' and OLD.kind is distinct from 'issued';
begin
  if TG_OP = 'DELETE' then
    if OLD.locked or OLD.kind = 'issued' then
      raise exception 'Devis émis/verrouillé — suppression interdite';
    end if;
    return OLD;
  end if;

  -- Émission : forcer locked, référence, issued_at, statut sent
  if NEW.kind = 'issued' then
    NEW.locked := true;
    if NEW.issued_at is null then
      NEW.issued_at := now();
    end if;
    if NEW.reference is null or length(trim(NEW.reference)) = 0 then
      NEW.reference := public.next_quote_reference();
    end if;
    if NEW.status = 'open' then
      NEW.status := 'sent';
    end if;
  end if;

  -- Interdiction de déverrouiller ou de rétrograder le type
  if OLD.locked = true and NEW.locked = false then
    raise exception 'Devis verrouillé — déverrouillage interdit';
  end if;
  if OLD.kind = 'issued' and NEW.kind <> 'issued' then
    raise exception 'Devis émis — changement de type interdit';
  end if;

  -- Après verrouillage (ou déjà émis) : seuls status (+ updated_at) mutables
  -- Exception : l’UPDATE d’émission elle-même (v_issuing) pose les champs contractuels.
  if v_was_locked and not v_issuing then
    if NEW.status is distinct from OLD.status
       and not public.quote_status_transition_allowed(OLD.status, NEW.status) then
      raise exception 'Transition de statut interdite : % → %', OLD.status, NEW.status;
    end if;

    -- prospect_id → NULL autorisé (dissociation CRM / RGPD) ; pas de réaffectation.
    if NEW.prospect_id is distinct from OLD.prospect_id
       and NEW.prospect_id is not null then
      raise exception 'Devis verrouillé — réaffectation de prospect interdite';
    end if;

    if NEW.reference is distinct from OLD.reference
      or NEW.kind is distinct from OLD.kind
      or NEW.project_id is distinct from OLD.project_id
      or NEW.configuration_id is distinct from OLD.configuration_id
      or NEW.commercial_request_id is distinct from OLD.commercial_request_id
      or NEW.trade_slug is distinct from OLD.trade_slug
      or NEW.plan_id is distinct from OLD.plan_id
      or NEW.currency is distinct from OLD.currency
      or NEW.creation_ht_cents is distinct from OLD.creation_ht_cents
      or NEW.creation_vat_cents is distinct from OLD.creation_vat_cents
      or NEW.creation_ttc_cents is distinct from OLD.creation_ttc_cents
      or NEW.recurring_cents is distinct from OLD.recurring_cents
      or NEW.tax_regime is distinct from OLD.tax_regime
      or NEW.vat_rate_bps is distinct from OLD.vat_rate_bps
      or NEW.pricing_complete is distinct from OLD.pricing_complete
      or NEW.catalog_fingerprint is distinct from OLD.catalog_fingerprint
      or NEW.lines_snapshot is distinct from OLD.lines_snapshot
      or NEW.pricing_snapshot is distinct from OLD.pricing_snapshot
      or NEW.issuer_snapshot is distinct from OLD.issuer_snapshot
      or NEW.client_snapshot is distinct from OLD.client_snapshot
      or NEW.notes is distinct from OLD.notes
      or NEW.valid_until is distinct from OLD.valid_until
      or NEW.issued_at is distinct from OLD.issued_at
      or NEW.issued_by is distinct from OLD.issued_by
      or NEW.locked is distinct from OLD.locked
    then
      raise exception 'Devis verrouillé — champs contractuels immuables (statut commercial et dissociation prospect uniquement)';
    end if;

    if NEW.status is distinct from OLD.status then
      insert into public.quote_status_events (quote_id, from_status, to_status, changed_by)
      values (OLD.id, OLD.status, NEW.status, v_actor);
    end if;

    return NEW;
  end if;

  -- Émission ou brouillon : valider / journaliser le statut
  if NEW.status is distinct from OLD.status then
    if v_issuing and OLD.status = 'open' and NEW.status = 'sent' then
      null; -- transition d’émission autorisée
    elsif not public.quote_status_transition_allowed(OLD.status, NEW.status) then
      raise exception 'Transition de statut interdite : % → %', OLD.status, NEW.status;
    end if;
    insert into public.quote_status_events (quote_id, from_status, to_status, changed_by)
    values (OLD.id, OLD.status, NEW.status, v_actor);
  elsif v_issuing then
    -- open→sent forcé sans différentiel visible si déjà sent
    insert into public.quote_status_events (quote_id, from_status, to_status, changed_by)
    values (OLD.id, OLD.status, NEW.status, v_actor);
  end if;

  return NEW;
end;
$$;

drop trigger if exists quotes_lock_guard on public.quotes;
drop trigger if exists quotes_immutability_guard on public.quotes;
create trigger quotes_immutability_guard
  before update or delete on public.quotes
  for each row execute function public.enforce_quote_immutability();

-- Anonymisation RGPD des demandes (conserve montants / tracking, efface PII)
create or replace function public.anonymize_commercial_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Réservé aux administrateurs';
  end if;

  update public.commercial_requests
  set
    contact_name = 'Anonymisé',
    contact_email = 'anonymise+' || id::text || '@invalid.local',
    contact_phone = null,
    company_name = null,
    message = null,
    ip_hash = null,
    user_agent = null,
    anonymized_at = now(),
    prospect_id = null,
    status = 'archived'
  where id = p_request_id
    and anonymized_at is null;

  update public.site_configurations sc
  set
    company_name = null,
    city = null,
    specialty = null,
    profile_snapshot = '{}'::jsonb,
    anonymized_at = now(),
    prospect_id = null
  from public.commercial_requests cr
  where cr.id = p_request_id
    and sc.id = cr.configuration_id
    and sc.anonymized_at is null;

  update public.quotes q
  set client_snapshot = jsonb_build_object('anonymized', true)
  where q.commercial_request_id = p_request_id
    and q.locked = false
    and q.kind <> 'issued';
  -- Devis émis : client_snapshot reste figé (obligation contractuelle) ;
  -- le lien prospect peut être nullifié sans toucher au snapshot.
  update public.quotes q
  set prospect_id = null
  where q.commercial_request_id = p_request_id;
end;
$$;

revoke all on function public.anonymize_commercial_request(uuid) from public;
grant execute on function public.anonymize_commercial_request(uuid) to authenticated;

drop trigger if exists site_configurations_set_updated_at on public.site_configurations;
create trigger site_configurations_set_updated_at
  before update on public.site_configurations
  for each row execute function public.set_updated_at();

drop trigger if exists commercial_requests_set_updated_at on public.commercial_requests;
create trigger commercial_requests_set_updated_at
  before update on public.commercial_requests
  for each row execute function public.set_updated_at();

drop trigger if exists quotes_set_updated_at on public.quotes;
create trigger quotes_set_updated_at
  before update on public.quotes
  for each row execute function public.set_updated_at();

comment on table public.site_configurations is 'V4 Lot 5 — configurations configurateur pour CRM et génération lot 6';
comment on table public.commercial_requests is 'V4 Lot 5 — demandes commerciales ; ON DELETE SET NULL sur prospect (pas de CASCADE)';
comment on table public.quotes is 'V4 Lot 5 — issued implique locked ; statuts mutables via transitions autorisées';
comment on table public.quote_status_events is 'V4 Lot 5 — historique des statuts commerciaux des devis';
comment on function public.claim_commercial_rate_limit(text, integer, integer) is 'Anti-spam atomique pour Edge Function (service_role)';
comment on function public.anonymize_commercial_request(uuid) is 'RGPD — efface PII demande sans détruire l’historique tarifaire';
