-- Soft-launch Site AZ — identité émetteur provisoire (à confirmer avant 01/01/2027).
-- Prérequis : 20261012140000_v4_commercial_quotes.sql déjà appliqué.

update public.business_settings
set
  legal_name = coalesce(nullif(trim(legal_name), ''), 'Site AZ (en cours d’immatriculation)'),
  trade_name = coalesce(nullif(trim(trade_name), ''), 'Site AZ'),
  email = coalesce(nullif(trim(email), ''), 'contact@site-az.fr'),
  city = coalesce(nullif(trim(city), ''), 'Oise'),
  address_line = coalesce(nullif(trim(address_line), ''), 'À confirmer'),
  postal_code = coalesce(nullif(trim(postal_code), ''), '00000'),
  tax_regime = case when tax_regime = 'unknown' then 'franchise' else tax_regime end,
  payment_terms = coalesce(nullif(trim(payment_terms), ''), 'Acompte 40 % à la commande, solde à la mise en ligne.'),
  updated_at = now()
where id = 'default';

insert into public.business_settings (
  id, legal_name, trade_name, email, city, address_line, postal_code, tax_regime, payment_terms
)
select
  'default',
  'Site AZ (en cours d’immatriculation)',
  'Site AZ',
  'contact@site-az.fr',
  'Oise',
  'À confirmer',
  '00000',
  'franchise',
  'Acompte 40 % à la commande, solde à la mise en ligne.'
where not exists (select 1 from public.business_settings where id = 'default');
