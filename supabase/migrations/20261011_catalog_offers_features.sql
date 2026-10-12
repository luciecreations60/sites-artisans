-- V4 lot 2 — Catalogue administrable (formules, fonctionnalités, tarifs)
-- ADDITIVE ONLY. Ne pas exécuter automatiquement sur la production dans ce lot.
-- Idempotent : réexécution sans doublons (ON CONFLICT).

-- ─── Formules ────────────────────────────────────────────────────────────────
create table if not exists public.catalog_plans (
  id text primary key check (id in ('essentiel', 'avance', 'pro')),
  name text not null,
  description text not null default '',
  setup_price_cents integer not null check (setup_price_cents >= 0),
  currency text not null default 'EUR' check (currency = 'EUR'),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  status text not null default 'draft' check (status in ('draft', 'published')),
  updated_at timestamptz not null default now()
);

-- ─── Prestataires externes ───────────────────────────────────────────────────
create table if not exists public.catalog_external_providers (
  id text primary key,
  name text not null,
  integration_level text not null check (integration_level in ('link', 'widget', 'api')),
  notes text not null default '',
  vendor_cost_note text
);

-- ─── Fonctionnalités (données commerciales) ──────────────────────────────────
create table if not exists public.catalog_features (
  id text primary key,
  category text not null check (category in ('presentation', 'interactions', 'services')),
  name text not null,
  description text not null default '',
  setup_price_cents integer check (setup_price_cents is null or setup_price_cents > 0),
  recurring_price_cents integer check (recurring_price_cents is null or recurring_price_cents > 0),
  billing_type text not null default 'none'
    check (billing_type in ('none', 'setup', 'recurring', 'setup_and_recurring', 'external', 'study')),
  commercial_kind text not null
    check (commercial_kind in (
      'included', 'optional_priced', 'optional_unpriced', 'study', 'unavailable', 'not_developed'
    )),
  is_available boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  personalization_level text not null default 'none'
    check (personalization_level in ('none', 'light', 'medium', 'deep')),
  dev_status text not null default 'todo' check (dev_status in ('ready', 'partial', 'todo')),
  sort_order integer not null default 0,
  external_provider_id text references public.catalog_external_providers (id) on delete set null,
  depends_on text[] not null default '{}',
  incompatible_with text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- ─── Internes (temps / rentabilité) — jamais en lecture anon ─────────────────
create table if not exists public.catalog_feature_internals (
  feature_id text primary key references public.catalog_features (id) on delete cascade,
  config_minutes integer check (config_minutes is null or config_minutes >= 0),
  complexity text check (complexity is null or complexity in ('low', 'medium', 'high')),
  profitability_note text
);

-- ─── Associations formule ↔ fonctionnalité ───────────────────────────────────
create table if not exists public.catalog_plan_features (
  plan_id text not null references public.catalog_plans (id) on delete cascade,
  feature_id text not null references public.catalog_features (id) on delete cascade,
  inclusion text not null check (inclusion in ('included', 'optional', 'unavailable')),
  variant_label text,
  primary key (plan_id, feature_id)
);

-- ─── Recommandations métier ──────────────────────────────────────────────────
create table if not exists public.catalog_trade_features (
  trade_slug text not null,
  feature_id text not null references public.catalog_features (id) on delete cascade,
  sort_order integer not null default 0,
  note text,
  primary key (trade_slug, feature_id)
);

-- ─── Vue publique : aucun champ interne ──────────────────────────────────────
create or replace view public.catalog_features_public
with (security_invoker = true)
as
select
  id,
  category,
  name,
  description,
  setup_price_cents,
  recurring_price_cents,
  billing_type,
  commercial_kind,
  is_available,
  status,
  personalization_level,
  dev_status,
  sort_order,
  external_provider_id,
  depends_on,
  incompatible_with,
  updated_at
from public.catalog_features;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.catalog_plans enable row level security;
alter table public.catalog_features enable row level security;
alter table public.catalog_feature_internals enable row level security;
alter table public.catalog_plan_features enable row level security;
alter table public.catalog_trade_features enable row level security;
alter table public.catalog_external_providers enable row level security;

drop policy if exists catalog_plans_public_select on public.catalog_plans;
create policy catalog_plans_public_select on public.catalog_plans
  for select using (status = 'published' and is_active = true);

drop policy if exists catalog_plans_admin_all on public.catalog_plans;
create policy catalog_plans_admin_all on public.catalog_plans
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists catalog_features_public_select on public.catalog_features;
create policy catalog_features_public_select on public.catalog_features
  for select using (status = 'published');

drop policy if exists catalog_features_admin_all on public.catalog_features;
create policy catalog_features_admin_all on public.catalog_features
  for all using (public.is_admin()) with check (public.is_admin());

-- Internes : admin uniquement (pas de policy select pour anon/authenticated non-admin)
drop policy if exists catalog_feature_internals_admin_all on public.catalog_feature_internals;
create policy catalog_feature_internals_admin_all on public.catalog_feature_internals
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists catalog_plan_features_public_select on public.catalog_plan_features;
create policy catalog_plan_features_public_select on public.catalog_plan_features
  for select using (
    exists (
      select 1 from public.catalog_plans p
      where p.id = plan_id and p.status = 'published' and p.is_active = true
    )
  );

drop policy if exists catalog_plan_features_admin_all on public.catalog_plan_features;
create policy catalog_plan_features_admin_all on public.catalog_plan_features
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists catalog_trade_features_public_select on public.catalog_trade_features;
create policy catalog_trade_features_public_select on public.catalog_trade_features
  for select using (true);

drop policy if exists catalog_trade_features_admin_all on public.catalog_trade_features;
create policy catalog_trade_features_admin_all on public.catalog_trade_features
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists catalog_external_providers_public_select on public.catalog_external_providers;
create policy catalog_external_providers_public_select on public.catalog_external_providers
  for select using (true);

drop policy if exists catalog_external_providers_admin_all on public.catalog_external_providers;
create policy catalog_external_providers_admin_all on public.catalog_external_providers
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.catalog_features_public to anon, authenticated;
grant select on public.catalog_plans to anon, authenticated;
grant select on public.catalog_plan_features to anon, authenticated;
grant select on public.catalog_trade_features to anon, authenticated;
grant select on public.catalog_external_providers to anon, authenticated;

-- ─── Seed formules ───────────────────────────────────────────────────────────
insert into public.catalog_plans (id, name, description, setup_price_cents, sort_order, is_active, status)
values
  ('essentiel', 'Essentiel', 'Une page claire pour être trouvé et contacté', 49000, 1, true, 'published'),
  ('avance', 'Avancé', 'Un site multipage pour présenter votre savoir-faire', 79000, 2, true, 'published'),
  ('pro', 'Pro', 'Une vitrine premium avec outils pour vos clients', 119000, 3, true, 'published')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  setup_price_cents = excluded.setup_price_cents,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  status = excluded.status,
  updated_at = now();

-- ─── Seed prestataires ───────────────────────────────────────────────────────
insert into public.catalog_external_providers (id, name, integration_level, notes, vendor_cost_note)
values
  ('planity', 'Planity', 'link', 'Réservation coiffure / beauté.', 'Abonnement Planity à la charge du client'),
  ('calendly', 'Calendly', 'link', 'Prise de rendez-vous par lien externe.', 'Abonnement Calendly à la charge du client'),
  ('simplybook', 'SimplyBook.me', 'widget', 'Widget éventuel — à vérifier par projet.', 'Abonnement SimplyBook à la charge du client'),
  ('ovh', 'OVH (hébergement / domaine)', 'link', 'Hors prix de création.', 'Facturé directement par OVH ou autre registrar')
on conflict (id) do update set
  name = excluded.name,
  integration_level = excluded.integration_level,
  notes = excluded.notes,
  vendor_cost_note = excluded.vendor_cost_note;

-- ─── Seed fonctionnalités (extrait aligné sur le catalogue statique app) ─────
-- Les lignes complètes sont aussi maintenues dans app/data/catalog/staticCatalog.ts
insert into public.catalog_features (
  id, category, name, description, setup_price_cents, recurring_price_cents,
  billing_type, commercial_kind, is_available, status, personalization_level,
  dev_status, sort_order, external_provider_id, depends_on, incompatible_with
) values
  ('services_list', 'presentation', 'Présentation des prestations', 'Liste claire de vos services.', null, null, 'none', 'included', true, 'published', 'light', 'ready', 20, null, '{}', '{}'),
  ('gallery_basic', 'presentation', 'Galerie de réalisations', 'Quelques projets représentatifs.', null, null, 'none', 'included', true, 'published', 'light', 'ready', 30, null, '{}', '{}'),
  ('gallery_filtered', 'presentation', 'Galerie enrichie et filtrable', 'Galerie avec filtres.', null, null, 'none', 'included', true, 'published', 'medium', 'ready', 40, null, '{gallery_basic}', '{}'),
  ('gallery_before_after', 'presentation', 'Galerie avant / après interactive', 'Comparaison avant / après.', null, null, 'none', 'included', true, 'published', 'medium', 'ready', 50, null, '{gallery_basic}', '{}'),
  ('testimonials', 'presentation', 'Témoignages', 'Avis clients.', null, null, 'none', 'included', true, 'published', 'light', 'ready', 60, null, '{}', '{}'),
  ('about_company', 'presentation', 'Présentation de l’entreprise', 'Histoire et valeurs.', null, null, 'none', 'included', true, 'published', 'light', 'ready', 80, null, '{}', '{}'),
  ('service_area', 'presentation', 'Zone d’intervention', 'Communes ou secteurs couverts.', null, null, 'none', 'included', true, 'published', 'light', 'ready', 90, null, '{}', '{}'),
  ('content_writing', 'presentation', 'Rédaction de contenu', 'Aide à la rédaction.', null, null, 'study', 'study', true, 'published', 'deep', 'ready', 120, null, '{}', '{}'),
  ('contact_form', 'interactions', 'Formulaire de contact', 'Formulaire simple.', null, null, 'none', 'included', true, 'published', 'light', 'ready', 200, null, '{}', '{}'),
  ('mobile_cta', 'interactions', 'Bouton d’appel sur mobile', 'Appel rapide.', null, null, 'none', 'included', true, 'published', 'none', 'ready', 205, null, '{}', '{}'),
  ('quote_form', 'interactions', 'Formulaire de devis guidé', 'Demande structurée.', null, null, 'none', 'included', true, 'published', 'medium', 'ready', 210, null, '{contact_form}', '{}'),
  ('quote_with_photos', 'interactions', 'Formulaire avec ajout de photos', 'Joindre des photos.', null, null, 'study', 'optional_unpriced', false, 'draft', 'medium', 'todo', 220, null, '{quote_form}', '{}'),
  ('estimator', 'interactions', 'Estimateur indicatif', 'Estimation non contractuelle.', null, null, 'none', 'included', true, 'published', 'medium', 'ready', 230, null, '{}', '{}'),
  ('booking_external', 'interactions', 'Prise de rendez-vous par lien externe', 'Lien Calendly / Planity.', null, null, 'external', 'optional_unpriced', true, 'published', 'light', 'ready', 240, 'calendly', '{}', '{booking_embedded}'),
  ('booking_embedded', 'interactions', 'Réservation intégrée', 'Module intégré.', null, null, 'external', 'study', false, 'draft', 'deep', 'todo', 250, 'simplybook', '{}', '{booking_external}'),
  ('catalog_services', 'interactions', 'Catalogue de prestations', 'Liste de prestations.', null, null, 'none', 'included', true, 'published', 'medium', 'ready', 260, null, '{services_list}', '{}'),
  ('catalog_products', 'interactions', 'Catalogue de produits', 'Présentation produits.', null, null, 'study', 'study', false, 'draft', 'medium', 'todo', 270, null, '{}', '{}'),
  ('order_external', 'interactions', 'Commande via prestataire externe', 'Commande en ligne tierce.', null, null, 'external', 'study', false, 'draft', 'medium', 'todo', 280, null, '{}', '{}'),
  ('gift_cards_external', 'interactions', 'Cartes cadeaux via service externe', 'Service tiers.', null, null, 'external', 'study', false, 'draft', 'light', 'todo', 290, null, '{}', '{}'),
  ('seo_basics', 'services', 'Bases du référencement local', 'Structure SEO de base.', null, null, 'none', 'included', true, 'published', 'light', 'ready', 295, null, '{}', '{}'),
  ('seo_local_extra', 'services', 'Référencement local complémentaire', 'SEO local avancé.', null, null, 'study', 'study', true, 'draft', 'deep', 'partial', 300, null, '{}', '{}'),
  ('google_business', 'services', 'Accompagnement Google Business Profile', 'Fiche Google.', null, null, 'study', 'study', true, 'draft', 'medium', 'partial', 310, null, '{}', '{}'),
  ('pages_extra', 'presentation', 'Pages supplémentaires', 'Pages hors périmètre.', null, null, 'study', 'study', false, 'draft', 'medium', 'todo', 10, null, '{}', '{}'),
  ('team', 'presentation', 'Présentation de l’équipe', 'Membres de l’équipe.', null, null, 'study', 'study', false, 'draft', 'medium', 'todo', 70, null, '{}', '{}'),
  ('map', 'presentation', 'Google Maps ou carte adaptée', 'Carte de localisation.', null, null, 'study', 'optional_unpriced', false, 'draft', 'light', 'partial', 100, null, '{service_area}', '{}'),
  ('news', 'presentation', 'Actualités', 'Espace actualités.', null, null, 'study', 'study', false, 'draft', 'medium', 'todo', 110, null, '{}', '{}'),
  ('qr_code', 'services', 'QR code', 'QR vers le site.', null, null, 'study', 'optional_unpriced', true, 'draft', 'none', 'ready', 320, null, '{}', '{}'),
  ('business_card', 'services', 'Carte de visite', 'Conception carte.', null, null, 'study', 'study', true, 'draft', 'medium', 'todo', 330, null, '{}', '{}'),
  ('flyer', 'services', 'Flyer', 'Conception flyer.', null, null, 'study', 'study', true, 'draft', 'medium', 'todo', 340, null, '{}', '{}'),
  ('training', 'services', 'Formation', 'Prise en main contenus.', null, null, 'study', 'study', true, 'draft', 'deep', 'partial', 350, null, '{}', '{}'),
  ('maintenance_tech', 'services', 'Maintenance technique', 'Suivi technique facultatif.', null, null, 'recurring', 'optional_unpriced', true, 'draft', 'none', 'partial', 360, null, '{}', '{}'),
  ('maintenance_support', 'services', 'Maintenance avec accompagnement', 'Technique + contenu.', null, null, 'recurring', 'optional_unpriced', true, 'draft', 'light', 'partial', 370, null, '{maintenance_tech}', '{}'),
  ('one_off_edits', 'services', 'Modifications ponctuelles', 'Interventions à la demande.', null, null, 'study', 'study', true, 'draft', 'none', 'ready', 380, null, '{}', '{}'),
  ('client_space', 'services', 'Espace client suivi de projet', 'Suivi via espace client.', null, null, 'none', 'included', true, 'published', 'none', 'ready', 390, null, '{}', '{}')
on conflict (id) do update set
  category = excluded.category,
  name = excluded.name,
  description = excluded.description,
  billing_type = excluded.billing_type,
  commercial_kind = excluded.commercial_kind,
  is_available = excluded.is_available,
  status = excluded.status,
  personalization_level = excluded.personalization_level,
  dev_status = excluded.dev_status,
  sort_order = excluded.sort_order,
  external_provider_id = excluded.external_provider_id,
  depends_on = excluded.depends_on,
  incompatible_with = excluded.incompatible_with,
  updated_at = now();

-- Internes (admin only)
insert into public.catalog_feature_internals (feature_id, config_minutes, complexity, profitability_note)
values
  ('services_list', 45, 'low', null),
  ('gallery_basic', 60, 'low', null),
  ('gallery_filtered', 120, 'medium', null),
  ('gallery_before_after', 150, 'medium', null),
  ('testimonials', 30, 'low', null),
  ('about_company', 45, 'low', null),
  ('service_area', 25, 'low', null),
  ('content_writing', 180, 'medium', null),
  ('contact_form', 40, 'low', null),
  ('mobile_cta', 15, 'low', null),
  ('quote_form', 90, 'medium', null),
  ('quote_with_photos', 120, 'medium', null),
  ('estimator', 150, 'high', null),
  ('booking_external', 35, 'low', null),
  ('booking_embedded', 240, 'high', null),
  ('catalog_services', 70, 'low', null),
  ('seo_basics', 45, 'low', null),
  ('maintenance_tech', 60, 'medium', null),
  ('client_space', 30, 'low', null)
on conflict (feature_id) do update set
  config_minutes = excluded.config_minutes,
  complexity = excluded.complexity;

-- Associations formules (alignées V3 / staticCatalog)
insert into public.catalog_plan_features (plan_id, feature_id, inclusion, variant_label) values
  ('essentiel', 'services_list', 'included', 'Liste simple'),
  ('essentiel', 'gallery_basic', 'included', '3 projets'),
  ('essentiel', 'gallery_filtered', 'unavailable', null),
  ('essentiel', 'gallery_before_after', 'unavailable', null),
  ('essentiel', 'testimonials', 'included', null),
  ('essentiel', 'about_company', 'included', null),
  ('essentiel', 'service_area', 'included', 'Mention'),
  ('essentiel', 'contact_form', 'included', null),
  ('essentiel', 'mobile_cta', 'included', null),
  ('essentiel', 'quote_form', 'unavailable', null),
  ('essentiel', 'estimator', 'unavailable', null),
  ('essentiel', 'content_writing', 'included', 'Textes de base'),
  ('essentiel', 'seo_basics', 'included', null),
  ('essentiel', 'client_space', 'included', null),
  ('essentiel', 'booking_external', 'optional', null),
  ('essentiel', 'maintenance_tech', 'optional', null),
  ('avance', 'services_list', 'included', 'Pages détaillées'),
  ('avance', 'gallery_basic', 'included', null),
  ('avance', 'gallery_filtered', 'included', null),
  ('avance', 'gallery_before_after', 'unavailable', null),
  ('avance', 'testimonials', 'included', null),
  ('avance', 'about_company', 'included', null),
  ('avance', 'service_area', 'included', 'Mise en avant'),
  ('avance', 'contact_form', 'included', null),
  ('avance', 'mobile_cta', 'included', null),
  ('avance', 'quote_form', 'included', 'Formulaire guidé'),
  ('avance', 'estimator', 'unavailable', null),
  ('avance', 'content_writing', 'included', 'Textes complets'),
  ('avance', 'seo_basics', 'included', 'Renforcé'),
  ('avance', 'client_space', 'included', null),
  ('avance', 'booking_external', 'optional', null),
  ('avance', 'maintenance_tech', 'optional', null),
  ('pro', 'services_list', 'included', 'Pages + mise en avant'),
  ('pro', 'gallery_basic', 'included', null),
  ('pro', 'gallery_filtered', 'included', null),
  ('pro', 'gallery_before_after', 'included', null),
  ('pro', 'testimonials', 'included', null),
  ('pro', 'about_company', 'included', null),
  ('pro', 'service_area', 'included', 'Mise en avant'),
  ('pro', 'contact_form', 'included', null),
  ('pro', 'mobile_cta', 'included', null),
  ('pro', 'quote_form', 'included', 'Guidé + estimateur'),
  ('pro', 'estimator', 'included', null),
  ('pro', 'content_writing', 'included', 'Textes + storytelling'),
  ('pro', 'seo_basics', 'included', 'Renforcé'),
  ('pro', 'client_space', 'included', null),
  ('pro', 'booking_external', 'optional', 'Formulaire / lien'),
  ('pro', 'maintenance_tech', 'optional', null)
on conflict (plan_id, feature_id) do update set
  inclusion = excluded.inclusion,
  variant_label = excluded.variant_label;

-- Recommandations métiers (11 slugs)
insert into public.catalog_trade_features (trade_slug, feature_id, sort_order, note) values
  ('plombier', 'quote_form', 10, 'Demande de devis guidée'),
  ('plombier', 'quote_with_photos', 20, 'Ajout de photos'),
  ('plombier', 'service_area', 30, 'Zone d’intervention'),
  ('plombier', 'gallery_before_after', 40, 'Galerie avant / après'),
  ('electricien', 'quote_form', 10, 'Demande de devis'),
  ('electricien', 'gallery_filtered', 20, 'Réalisations'),
  ('electricien', 'service_area', 30, 'Zone d’intervention'),
  ('electricien', 'quote_with_photos', 40, 'Photos'),
  ('electricien', 'catalog_services', 50, 'Prestations spécialisées'),
  ('couvreur', 'gallery_before_after', 10, 'Avant / après'),
  ('couvreur', 'booking_external', 20, 'Demande de visite'),
  ('couvreur', 'gallery_basic', 30, 'Photos'),
  ('couvreur', 'service_area', 40, 'Zone d’intervention'),
  ('peintre', 'gallery_before_after', 10, 'Galerie avant / après'),
  ('peintre', 'estimator', 20, 'Estimateur indicatif de surface'),
  ('peintre', 'gallery_filtered', 30, 'Réalisations'),
  ('paysagiste', 'gallery_filtered', 10, 'Galerie enrichie'),
  ('paysagiste', 'gallery_before_after', 20, 'Avant / après'),
  ('paysagiste', 'estimator', 30, 'Estimation indicative'),
  ('paysagiste', 'catalog_services', 40, 'Entretien'),
  ('paysagiste', 'service_area', 50, 'Zone d’intervention'),
  ('garage', 'booking_external', 10, 'Rendez-vous'),
  ('garage', 'catalog_services', 20, 'Liste des prestations'),
  ('garage', 'quote_form', 30, 'Devis'),
  ('garage', 'quote_with_photos', 40, 'Informations sur le véhicule'),
  ('boulanger', 'catalog_products', 10, 'Catalogue'),
  ('boulanger', 'order_external', 20, 'Commande externe'),
  ('boulanger', 'catalog_services', 30, 'Spécialités'),
  ('boulanger', 'about_company', 40, 'Horaires'),
  ('coiffure', 'booking_external', 10, 'Réservation externe'),
  ('coiffure', 'gallery_basic', 20, 'Galerie'),
  ('coiffure', 'catalog_services', 30, 'Tarifs'),
  ('coiffure', 'team', 40, 'Équipe'),
  ('bienetre', 'catalog_services', 10, 'Catalogue de soins'),
  ('bienetre', 'booking_external', 20, 'Réservation'),
  ('bienetre', 'gift_cards_external', 30, 'Cartes cadeaux'),
  ('bienetre', 'team', 40, 'Praticiens'),
  ('cordonnier', 'gallery_before_after', 10, 'Avant / après'),
  ('cordonnier', 'quote_with_photos', 20, 'Demande avec photo'),
  ('cordonnier', 'catalog_services', 30, 'Prestations'),
  ('serrurier', 'mobile_cta', 10, 'Dépannage'),
  ('serrurier', 'service_area', 20, 'Zone d’intervention'),
  ('serrurier', 'quote_form', 30, 'Demande d’intervention'),
  ('serrurier', 'catalog_services', 40, 'Tarifs indicatifs')
on conflict (trade_slug, feature_id) do update set
  sort_order = excluded.sort_order,
  note = excluded.note;
