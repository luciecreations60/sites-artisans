-- V4 Lot 5 — Configurations, demandes commerciales, devis (additive)
-- Ne modifie pas les migrations antérieures ni les devis historiques (documents uploadés).
-- À appliquer manuellement ; non exécutée automatiquement en production.

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
  -- franchise | liable | unknown
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

-- Demande commerciale (intake public via Edge Function service_role)
create table if not exists public.commercial_requests (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null unique,
  client_request_id text,
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  configuration_id uuid references public.site_configurations (id) on delete set null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  company_name text,
  message text,
  contact_preference text
    check (contact_preference is null or contact_preference in ('email', 'phone', 'either')),
  source_code text not null default 'configurateur_v4',
  -- Montants recalculés serveur (centimes) — jamais confiance au total navigateur
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

-- Anti-spam simple (Edge Function)
create table if not exists public.commercial_request_rate_limits (
  bucket_key text primary key,
  hit_count integer not null default 0,
  window_started_at timestamptz not null default now()
);

alter table public.commercial_request_rate_limits enable row level security;
-- Pas de policy publique : uniquement service_role

-- Devis (simulation / brouillon / émis) — snapshot immuable une fois issued
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
  -- Une fois issued, bloquer les updates destructifs via trigger
  locked boolean not null default false
);

create index if not exists quotes_prospect_idx on public.quotes (prospect_id);
create index if not exists quotes_project_idx on public.quotes (project_id);

alter table public.quotes enable row level security;

drop policy if exists quotes_admin_all on public.quotes;
create policy quotes_admin_all on public.quotes
  for all using (public.is_admin()) with check (public.is_admin());

-- Client authentifié : lecture seule de ses devis liés à un projet dont il est owner
drop policy if exists quotes_client_select on public.quotes;
create policy quotes_client_select on public.quotes
  for select using (
    project_id is not null
    and public.owns_project(project_id)
    and kind = 'issued'
  );

create or replace function public.prevent_locked_quote_mutation()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'UPDATE' and OLD.locked = true then
    raise exception 'Devis verrouillé — modification interdite';
  end if;
  if TG_OP = 'DELETE' and OLD.locked = true then
    raise exception 'Devis verrouillé — suppression interdite';
  end if;
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists quotes_lock_guard on public.quotes;
create trigger quotes_lock_guard
  before update or delete on public.quotes
  for each row execute function public.prevent_locked_quote_mutation();

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
comment on table public.commercial_requests is 'V4 Lot 5 — demandes commerciales issues du configurateur';
comment on table public.quotes is 'V4 Lot 5 — simulations et devis ; issued+locked immuables';
