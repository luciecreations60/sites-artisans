-- CRM Phase 4 — Conversion Prospect → Profile / Project / espace client
-- Admin only via public.is_admin() ; claim / lookup via security definer (service_role ou admin).

-- ═══════════════════════════════════════════════════════════════════════════
-- Colonnes prospects / projects
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.prospects
  add column if not exists converted_profile_id uuid references public.profiles (id) on delete set null,
  add column if not exists converted_at timestamptz,
  add column if not exists converted_by uuid references public.profiles (id) on delete set null,
  add column if not exists conversion_lock_at timestamptz,
  add column if not exists conversion_lock_token uuid;

alter table public.projects
  add column if not exists source_prospect_id uuid references public.prospects (id) on delete set null,
  add column if not exists source_demo_id uuid references public.prospect_demos (id) on delete set null;

create unique index if not exists projects_source_prospect_id_uidx
  on public.projects (source_prospect_id)
  where source_prospect_id is not null;

create index if not exists prospects_converted_at_idx
  on public.prospects (converted_at)
  where converted_at is not null;

create index if not exists projects_source_demo_id_idx
  on public.projects (source_demo_id)
  where source_demo_id is not null;

-- ═══════════════════════════════════════════════════════════════════════════
-- Type d'interaction système « conversion »
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.prospect_interaction_types (code, label, sort_order, is_system, counts_as_contact)
values ('conversion', 'Conversion client', 120, true, false)
on conflict (code) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_system = excluded.is_system,
  counts_as_contact = excluded.counts_as_contact;

-- ═══════════════════════════════════════════════════════════════════════════
-- Lookup profil par e-mail normalisé (pas d'ILIKE / wildcards)
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.find_profiles_by_login_email(p_email text)
returns setof public.profiles
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() is distinct from 'service_role' and not public.is_admin() then
    raise exception 'Accès refusé';
  end if;

  if p_email is null or nullif(trim(p_email), '') is null then
    return;
  end if;

  return query
  select p.*
  from public.profiles p
  where p.email is not null
    and lower(trim(p.email)) = lower(trim(p_email));
end;
$$;

revoke all on function public.find_profiles_by_login_email(text) from public;
grant execute on function public.find_profiles_by_login_email(text) to service_role;
grant execute on function public.find_profiles_by_login_email(text) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- Claim / release atomiques de conversion
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.claim_prospect_conversion(
  p_prospect_id uuid,
  p_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated uuid;
  v_converted_at timestamptz;
  v_converted_profile_id uuid;
begin
  if auth.role() is distinct from 'service_role' and not public.is_admin() then
    raise exception 'Accès refusé';
  end if;

  if p_prospect_id is null or p_token is null then
    return jsonb_build_object('status', 'invalid');
  end if;

  update public.prospects
  set
    conversion_lock_at = now(),
    conversion_lock_token = p_token
  where id = p_prospect_id
    and converted_at is null
    and (
      conversion_lock_at is null
      or conversion_lock_at < now() - interval '15 minutes'
    )
  returning id into v_updated;

  if v_updated is not null then
    return jsonb_build_object('status', 'claimed');
  end if;

  select converted_at, converted_profile_id
    into v_converted_at, v_converted_profile_id
  from public.prospects
  where id = p_prospect_id;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  if v_converted_at is not null then
    return jsonb_build_object(
      'status', 'already_converted',
      'converted_profile_id', v_converted_profile_id,
      'converted_at', v_converted_at
    );
  end if;

  return jsonb_build_object('status', 'locked');
end;
$$;

revoke all on function public.claim_prospect_conversion(uuid, uuid) from public;
grant execute on function public.claim_prospect_conversion(uuid, uuid) to service_role;
grant execute on function public.claim_prospect_conversion(uuid, uuid) to authenticated;

create or replace function public.release_prospect_conversion_lock(
  p_prospect_id uuid,
  p_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int := 0;
begin
  if auth.role() is distinct from 'service_role' and not public.is_admin() then
    raise exception 'Accès refusé';
  end if;

  update public.prospects
  set
    conversion_lock_at = null,
    conversion_lock_token = null
  where id = p_prospect_id
    and conversion_lock_token = p_token;

  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

revoke all on function public.release_prospect_conversion_lock(uuid, uuid) from public;
grant execute on function public.release_prospect_conversion_lock(uuid, uuid) to service_role;
grant execute on function public.release_prospect_conversion_lock(uuid, uuid) to authenticated;
