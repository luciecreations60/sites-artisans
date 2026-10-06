-- CRM Phase 3 — Prospection e-mail (individuel + campagnes ciblées / file d'attente)
-- Admin only via public.is_admin(). Secrets SMTP hors base (Edge Functions).

-- ═══════════════════════════════════════════════════════════════════════════
-- Référentiels
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.prospect_email_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prospect_email_statuses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prospect_email_campaign_statuses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.prospect_email_types (code, label, sort_order, is_system) values
  ('first_contact', 'Premier contact', 10, true),
  ('follow_up_1', 'Première relance', 20, true),
  ('follow_up_2', 'Deuxième relance', 30, true),
  ('demo_share', 'Envoi de démo', 40, true),
  ('appointment_follow_up', 'Suite rendez-vous', 50, true),
  ('quote_follow_up', 'Relance devis', 60, true),
  ('custom', 'Message personnalisé', 70, true)
on conflict (code) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_system = excluded.is_system;

insert into public.prospect_email_statuses (code, label, sort_order, is_system) values
  ('draft', 'Brouillon', 10, true),
  ('ready', 'Prêt à envoyer', 20, true),
  ('queued', 'En file d''attente', 30, true),
  ('sending', 'Envoi en cours', 40, true),
  ('sent', 'Envoyé', 50, true),
  ('failed', 'Échec', 60, true),
  ('cancelled', 'Annulé', 70, true)
on conflict (code) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_system = excluded.is_system;

insert into public.prospect_email_campaign_statuses (code, label, sort_order, is_system) values
  ('draft', 'Brouillon', 10, true),
  ('ready', 'Prête', 20, true),
  ('running', 'En cours', 30, true),
  ('completed', 'Terminée', 40, true),
  ('paused', 'En pause', 50, true),
  ('cancelled', 'Annulée', 60, true)
on conflict (code) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_system = excluded.is_system;

-- Guard codes système
create or replace function public.prospect_email_ref_guard_system()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if old.is_system and new.code is distinct from old.code then
      raise exception 'Le code système ne peut pas être modifié';
    end if;
    if old.is_system and new.is_system is distinct from old.is_system then
      raise exception 'Le flag is_system ne peut pas être modifié';
    end if;
  end if;
  if tg_op = 'DELETE' and old.is_system then
    raise exception 'Une valeur système ne peut pas être supprimée';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists prospect_email_types_guard on public.prospect_email_types;
create trigger prospect_email_types_guard
  before update or delete on public.prospect_email_types
  for each row execute function public.prospect_email_ref_guard_system();

drop trigger if exists prospect_email_statuses_guard on public.prospect_email_statuses;
create trigger prospect_email_statuses_guard
  before update or delete on public.prospect_email_statuses
  for each row execute function public.prospect_email_ref_guard_system();

drop trigger if exists prospect_email_campaign_statuses_guard on public.prospect_email_campaign_statuses;
create trigger prospect_email_campaign_statuses_guard
  before update or delete on public.prospect_email_campaign_statuses
  for each row execute function public.prospect_email_ref_guard_system();

-- ═══════════════════════════════════════════════════════════════════════════
-- Settings (pas de secrets)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.crm_email_settings (
  id uuid primary key default gen_random_uuid(),
  provider_code text not null default 'ovh_smtp',
  sender_name text not null default 'Sites Artisans',
  sender_company text not null default 'Sites Artisans',
  sender_email text not null default '',
  sender_phone text,
  sender_website text,
  reply_to text,
  email_footer text default 'Si vous ne souhaitez plus recevoir de message de ma part, vous pouvez simplement me l''indiquer en réponse.',
  default_first_follow_up_days int not null default 5,
  default_second_follow_up_days int not null default 10,
  max_emails_per_day int not null default 50,
  max_emails_per_hour int not null default 10,
  default_campaign_max_recipients int not null default 50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_email_settings_limits_positive check (
    max_emails_per_day > 0 and max_emails_per_hour > 0 and default_campaign_max_recipients > 0
  )
);

insert into public.crm_email_settings (id)
select gen_random_uuid()
where not exists (select 1 from public.crm_email_settings);

-- ═══════════════════════════════════════════════════════════════════════════
-- Templates
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.prospect_email_templates (
  id uuid primary key default gen_random_uuid(),
  email_type_id uuid not null references public.prospect_email_types (id),
  name text not null,
  subject_template text not null,
  body_template text not null,
  is_active boolean not null default true,
  is_default boolean not null default false,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists prospect_email_templates_one_default_per_type
  on public.prospect_email_templates (email_type_id)
  where is_default;

-- Seeds modèles (idempotent via name + type)
do $$
declare
  t_first uuid;
  t_fu1 uuid;
  t_demo uuid;
begin
  select id into t_first from public.prospect_email_types where code = 'first_contact';
  select id into t_fu1 from public.prospect_email_types where code = 'follow_up_1';
  select id into t_demo from public.prospect_email_types where code = 'demo_share';

  if t_first is not null and not exists (
    select 1 from public.prospect_email_templates where email_type_id = t_first and is_default
  ) then
    insert into public.prospect_email_templates (email_type_id, name, subject_template, body_template, is_default)
    values (
      t_first,
      'Premier contact — standard',
      'Site internet pour {{company_name}} — {{city}}',
      E'Bonjour{{contact_first_name}},\n\nJe m''appelle {{sender_first_name}} ({{sender_company}}). J''accompagne les artisans comme vous à {{city}} avec un site clair, rapide à mettre en place.\n\nSeriez-vous ouvert(e) à un échange rapide, sans engagement ?\n\nCordialement,\n{{sender_first_name}}\n{{sender_company}}\n{{sender_phone}}\n{{sender_email}}',
      true
    );
  end if;

  if t_fu1 is not null and not exists (
    select 1 from public.prospect_email_templates where email_type_id = t_fu1 and is_default
  ) then
    insert into public.prospect_email_templates (email_type_id, name, subject_template, body_template, is_default)
    values (
      t_fu1,
      'Première relance — standard',
      'Suite — site pour {{company_name}}',
      E'Bonjour{{contact_first_name}},\n\nJe me permets un court rappel suite à mon précédent message concernant un site pour {{company_name}}.\n\nSi le moment n''est pas le bon, dites-le-moi simplement.\n\nCordialement,\n{{sender_first_name}}\n{{sender_company}}\n{{sender_phone}}\n{{sender_email}}',
      true
    );
  end if;

  if t_demo is not null and not exists (
    select 1 from public.prospect_email_templates where email_type_id = t_demo and is_default
  ) then
    insert into public.prospect_email_templates (email_type_id, name, subject_template, body_template, is_default)
    values (
      t_demo,
      'Envoi de démo — standard',
      'Aperçu personnalisé pour {{company_name}}',
      E'Bonjour{{contact_first_name}},\n\nJ''ai préparé un aperçu de site personnalisé pour {{company_name}}.\n\nVous pouvez le consulter ici :\n{{demo_url}}\n\nJe reste disponible pour en parler.\n\nCordialement,\n{{sender_first_name}}\n{{sender_company}}\n{{sender_phone}}\n{{sender_email}}',
      true
    );
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Campagnes
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.prospect_email_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status_id uuid not null references public.prospect_email_campaign_statuses (id),
  trade_slug text,
  description text,
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.prospect_email_campaigns_set_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status_id is null then
    select id into new.status_id from public.prospect_email_campaign_statuses where code = 'draft' limit 1;
  end if;
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists prospect_email_campaigns_set_defaults on public.prospect_email_campaigns;
create trigger prospect_email_campaigns_set_defaults
  before insert on public.prospect_email_campaigns
  for each row execute function public.prospect_email_campaigns_set_defaults();

-- ═══════════════════════════════════════════════════════════════════════════
-- Emails (snapshots)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.prospect_emails (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  campaign_id uuid references public.prospect_email_campaigns (id) on delete set null,
  email_type_id uuid not null references public.prospect_email_types (id),
  email_status_id uuid not null references public.prospect_email_statuses (id),
  template_id uuid references public.prospect_email_templates (id) on delete set null,
  demo_id uuid references public.prospect_demos (id) on delete set null,

  recipient_email text not null default '',
  recipient_name text,

  subject text not null default '',
  body_text text not null default '',
  body_html text,

  provider_code text,
  provider_message_id text,
  generated_by_ai boolean not null default false,

  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  ready_at timestamptz,
  queued_at timestamptz,
  sending_at timestamptz,
  sent_at timestamptz,
  failed_at timestamptz,
  failure_reason text
);

create or replace function public.prospect_emails_set_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_status_id is null then
    select id into new.email_status_id from public.prospect_email_statuses where code = 'draft' limit 1;
  end if;
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists prospect_emails_set_defaults on public.prospect_emails;
create trigger prospect_emails_set_defaults
  before insert on public.prospect_emails
  for each row execute function public.prospect_emails_set_defaults();

-- updated_at
drop trigger if exists prospect_email_types_updated_at on public.prospect_email_types;
create trigger prospect_email_types_updated_at
  before update on public.prospect_email_types
  for each row execute function public.set_updated_at();

drop trigger if exists prospect_email_statuses_updated_at on public.prospect_email_statuses;
create trigger prospect_email_statuses_updated_at
  before update on public.prospect_email_statuses
  for each row execute function public.set_updated_at();

drop trigger if exists prospect_email_campaign_statuses_updated_at on public.prospect_email_campaign_statuses;
create trigger prospect_email_campaign_statuses_updated_at
  before update on public.prospect_email_campaign_statuses
  for each row execute function public.set_updated_at();

drop trigger if exists prospect_email_templates_updated_at on public.prospect_email_templates;
create trigger prospect_email_templates_updated_at
  before update on public.prospect_email_templates
  for each row execute function public.set_updated_at();

drop trigger if exists crm_email_settings_updated_at on public.crm_email_settings;
create trigger crm_email_settings_updated_at
  before update on public.crm_email_settings
  for each row execute function public.set_updated_at();

drop trigger if exists prospect_email_campaigns_updated_at on public.prospect_email_campaigns;
create trigger prospect_email_campaigns_updated_at
  before update on public.prospect_email_campaigns
  for each row execute function public.set_updated_at();

drop trigger if exists prospect_emails_updated_at on public.prospect_emails;
create trigger prospect_emails_updated_at
  before update on public.prospect_emails
  for each row execute function public.set_updated_at();

-- Indexes
create index if not exists prospect_emails_prospect_id_idx on public.prospect_emails (prospect_id);
create index if not exists prospect_emails_campaign_id_idx on public.prospect_emails (campaign_id);
create index if not exists prospect_emails_status_id_idx on public.prospect_emails (email_status_id);
create index if not exists prospect_emails_sent_at_idx on public.prospect_emails (sent_at desc);
create index if not exists prospect_emails_queued_at_idx on public.prospect_emails (queued_at);
create index if not exists prospect_email_campaigns_status_id_idx on public.prospect_email_campaigns (status_id);
create index if not exists prospect_email_templates_type_id_idx on public.prospect_email_templates (email_type_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS — admin only
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.prospect_email_types enable row level security;
alter table public.prospect_email_statuses enable row level security;
alter table public.prospect_email_campaign_statuses enable row level security;
alter table public.prospect_email_templates enable row level security;
alter table public.crm_email_settings enable row level security;
alter table public.prospect_email_campaigns enable row level security;
alter table public.prospect_emails enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'prospect_email_types',
    'prospect_email_statuses',
    'prospect_email_campaign_statuses',
    'prospect_email_templates',
    'crm_email_settings',
    'prospect_email_campaigns',
    'prospect_emails'
  ]
  loop
    execute format('drop policy if exists %I_admin_all on public.%I', t, t);
    execute format(
      'create policy %I_admin_all on public.%I for all using (public.is_admin()) with check (public.is_admin())',
      t, t
    );
  end loop;
end $$;
