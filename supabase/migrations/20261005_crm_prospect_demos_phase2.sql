-- CRM Phase 2 — Démos personnalisées prospects
-- Admin only sur les tables. Accès public uniquement via RPC SECURITY DEFINER durcies.

-- ═══════════════════════════════════════════════════════════════════════════
-- Référentiel statuts démo
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.prospect_demo_statuses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.prospect_demo_statuses (code, label, sort_order, is_system) values
  ('draft', 'Brouillon', 10, true),
  ('ready', 'Prête', 20, true),
  ('published', 'Publiée', 30, true),
  ('shared', 'Partagée', 40, true),
  ('disabled', 'Désactivée', 50, true)
on conflict (code) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_system = excluded.is_system;

-- ═══════════════════════════════════════════════════════════════════════════
-- Démos
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.prospect_demos (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  status_id uuid not null references public.prospect_demo_statuses (id),
  public_slug text not null unique,
  trade_slug text not null,
  enabled_offer_tiers text[] not null default array['essentiel', 'avance', 'pro']::text[],
  is_primary boolean not null default false,

  -- Snapshot affichable (copié depuis le prospect à la création, éditable)
  company_name text not null,
  commercial_name text,
  contact_first_name text,
  contact_last_name text,
  specialty text,
  city text,
  phone text,
  email text,
  address text,
  service_area text,
  custom_tagline text,
  custom_intro text,
  theme_id text not null default 'sage',
  font_id text not null default 'classic',

  published_at timestamptz,
  shared_at timestamptz,
  disabled_at timestamptz,
  expires_at timestamptz,
  view_count int not null default 0,
  last_viewed_at timestamptz,

  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint prospect_demos_tiers_nonempty check (cardinality(enabled_offer_tiers) >= 1),
  constraint prospect_demos_tiers_valid check (
    enabled_offer_tiers <@ array['essentiel', 'avance', 'pro']::text[]
  )
);

-- Une seule démo principale par prospect
create unique index if not exists prospect_demos_one_primary_per_prospect
  on public.prospect_demos (prospect_id)
  where is_primary;

create index if not exists prospect_demos_prospect_id_idx on public.prospect_demos (prospect_id);
create index if not exists prospect_demos_status_id_idx on public.prospect_demos (status_id);
create index if not exists prospect_demos_public_slug_idx on public.prospect_demos (public_slug);
create index if not exists prospect_demos_created_at_idx on public.prospect_demos (created_at desc);

drop trigger if exists prospect_demo_statuses_updated_at on public.prospect_demo_statuses;
create trigger prospect_demo_statuses_updated_at
  before update on public.prospect_demo_statuses
  for each row execute function public.set_updated_at();

drop trigger if exists prospect_demos_updated_at on public.prospect_demos;
create trigger prospect_demos_updated_at
  before update on public.prospect_demos
  for each row execute function public.set_updated_at();

-- Defaults : statut draft, created_by, première démo = primaire
create or replace function public.prospect_demos_set_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if new.status_id is null then
    select id into new.status_id from public.prospect_demo_statuses where code = 'draft' limit 1;
  end if;
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  if tg_op = 'INSERT' then
    select count(*)::int into v_count from public.prospect_demos where prospect_id = new.prospect_id;
    if v_count = 0 then
      new.is_primary := true;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists prospect_demos_set_defaults on public.prospect_demos;
create trigger prospect_demos_set_defaults
  before insert on public.prospect_demos
  for each row execute function public.prospect_demos_set_defaults();

-- Quand une démo devient primaire, retirer is_primary des autres du même prospect
create or replace function public.prospect_demos_enforce_primary()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_primary then
    update public.prospect_demos
    set is_primary = false
    where prospect_id = new.prospect_id
      and id is distinct from new.id
      and is_primary = true;
  end if;
  return new;
end;
$$;

drop trigger if exists prospect_demos_enforce_primary on public.prospect_demos;
create trigger prospect_demos_enforce_primary
  after insert or update of is_primary on public.prospect_demos
  for each row
  when (new.is_primary = true)
  execute function public.prospect_demos_enforce_primary();

-- Empêcher la modification des codes système du référentiel démo
create or replace function public.prospect_demo_statuses_guard_system()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if old.is_system and new.code is distinct from old.code then
      raise exception 'Le code système d''un statut de démo ne peut pas être modifié';
    end if;
    if old.is_system and new.is_system is distinct from old.is_system then
      raise exception 'Le flag is_system d''un statut de démo système ne peut pas être modifié';
    end if;
  end if;
  if tg_op = 'DELETE' and old.is_system then
    raise exception 'Un statut de démo système ne peut pas être supprimé';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists prospect_demo_statuses_guard_system on public.prospect_demo_statuses;
create trigger prospect_demo_statuses_guard_system
  before update or delete on public.prospect_demo_statuses
  for each row execute function public.prospect_demo_statuses_guard_system();

-- ═══════════════════════════════════════════════════════════════════════════
-- Accessibilité publique (helper SQL — source de vérité sécurité)
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.is_prospect_demo_publicly_accessible(p_demo public.prospect_demos)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_demo.published_at is not null
    and p_demo.disabled_at is null
    and (p_demo.expires_at is null or p_demo.expires_at > now())
    and exists (
      select 1
      from public.prospect_demo_statuses s
      where s.id = p_demo.status_id
        and s.code in ('published', 'shared')
    );
$$;

revoke all on function public.is_prospect_demo_publicly_accessible(public.prospect_demos) from public;
revoke all on function public.is_prospect_demo_publicly_accessible(public.prospect_demos) from anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- RPC publique : lecture (colonnes affichables uniquement)
-- Ne retourne PAS prospect_id, created_by, address, service_area, notes CRM
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.get_public_prospect_demo(p_slug text)
returns table (
  public_slug text,
  trade_slug text,
  enabled_offer_tiers text[],
  company_name text,
  commercial_name text,
  contact_first_name text,
  contact_last_name text,
  specialty text,
  city text,
  phone text,
  email text,
  custom_tagline text,
  custom_intro text,
  theme_id text,
  font_id text,
  status_code text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_slug is null or length(trim(p_slug)) = 0 then
    return;
  end if;

  return query
  select
    d.public_slug,
    d.trade_slug,
    d.enabled_offer_tiers,
    d.company_name,
    d.commercial_name,
    d.contact_first_name,
    d.contact_last_name,
    d.specialty,
    d.city,
    d.phone,
    d.email,
    d.custom_tagline,
    d.custom_intro,
    d.theme_id,
    d.font_id,
    s.code as status_code
  from public.prospect_demos d
  join public.prospect_demo_statuses s on s.id = d.status_id
  where d.public_slug = trim(p_slug)
    and public.is_prospect_demo_publicly_accessible(d)
  limit 1;
end;
$$;

revoke all on function public.get_public_prospect_demo(text) from public;
grant execute on function public.get_public_prospect_demo(text) to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- RPC publique : incrément atomique des vues (uniquement si accessible)
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.record_public_prospect_demo_view(p_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_slug is null or length(trim(p_slug)) = 0 then
    return;
  end if;

  update public.prospect_demos d
  set
    view_count = d.view_count + 1,
    last_viewed_at = now()
  where d.public_slug = trim(p_slug)
    and public.is_prospect_demo_publicly_accessible(d);
end;
$$;

revoke all on function public.record_public_prospect_demo_view(text) from public;
grant execute on function public.record_public_prospect_demo_view(text) to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS — admin only (pas de SELECT anon sur la table)
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.prospect_demo_statuses enable row level security;
alter table public.prospect_demos enable row level security;

drop policy if exists prospect_demo_statuses_admin_all on public.prospect_demo_statuses;
create policy prospect_demo_statuses_admin_all on public.prospect_demo_statuses
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists prospect_demos_admin_all on public.prospect_demos;
create policy prospect_demos_admin_all on public.prospect_demos
  for all using (public.is_admin()) with check (public.is_admin());
