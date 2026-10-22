-- Recette Lot C — émettre + verrouiller un devis simulation (SQL Editor).
-- Cible : tracking AZ-B311151C18 (fallback : dernière simulation éligible).
-- Le trigger enforce_quote_immutability génère la référence via next_quote_reference().

do $$
declare
  v_quote_id uuid;
  v_settings public.business_settings%rowtype;
  v_ref text;
begin
  select * into v_settings from public.business_settings where id = 'default';
  if v_settings.id is null then
    raise exception 'business_settings default manquant';
  end if;
  if coalesce(trim(v_settings.legal_name), '') = ''
     or coalesce(trim(v_settings.address_line), '') = ''
     or coalesce(trim(v_settings.city), '') = '' then
    raise exception 'business_settings incomplet (legal_name, address_line, city)';
  end if;
  if v_settings.tax_regime = 'unknown' then
    raise exception 'tax_regime encore unknown — appliquer le SQL soft-launch Site AZ';
  end if;

  select q.id into v_quote_id
  from public.quotes q
  join public.commercial_requests r on r.id = q.commercial_request_id
  where r.tracking_code = 'AZ-B311151C18'
    and q.kind in ('simulation', 'draft')
    and q.locked = false
    and q.pricing_complete = true
  order by q.created_at desc
  limit 1;

  if v_quote_id is null then
    select id into v_quote_id
    from public.quotes
    where kind in ('simulation', 'draft')
      and locked = false
      and pricing_complete = true
    order by created_at desc
    limit 1;
  end if;

  if v_quote_id is null then
    raise exception 'Aucune simulation éligible à émettre';
  end if;

  update public.quotes
  set
    kind = 'issued',
    status = 'sent',
    locked = true,
    issued_at = now(),
    valid_until = (current_date + (coalesce(v_settings.quote_validity_days, 30) || ' days')::interval)::date,
    tax_regime = v_settings.tax_regime,
    vat_rate_bps = v_settings.vat_rate_bps,
    issuer_snapshot = jsonb_build_object(
      'legal_name', v_settings.legal_name,
      'trade_name', v_settings.trade_name,
      'address_line', v_settings.address_line,
      'postal_code', v_settings.postal_code,
      'city', v_settings.city,
      'email', v_settings.email,
      'phone', v_settings.phone,
      'siret', v_settings.siret,
      'vat_number', v_settings.vat_number,
      'tax_regime', v_settings.tax_regime,
      'vat_rate_bps', v_settings.vat_rate_bps,
      'payment_terms', v_settings.payment_terms
    ),
    notes = 'Devis contractuel — snapshot figé (recette Lot C).',
    updated_at = now()
  where id = v_quote_id
  returning reference into v_ref;

  raise notice 'Devis émis id=% reference=%', v_quote_id, v_ref;
end $$;

select id, reference, kind, status, locked, issued_at, creation_ht_cents,
       issuer_snapshot->>'legal_name' as issuer
from public.quotes
where kind = 'issued' and locked = true
order by issued_at desc nulls last
limit 5;
