-- Recette soft-launch — accepter le devis émis + créer un projet CRM + lier la config.
-- Cible : tracking AZ-B311151C18 (fallback : dernier devis issued/sent/locked).
-- Note : project_id sur quotes est IMMUABLE après verrouillage — on lie via site_configurations.project_id.
-- À coller dans Supabase SQL Editor.

do $$
declare
  v_quote public.quotes%rowtype;
  v_cfg_id uuid;
  v_prospect_id uuid;
  v_client_id uuid;
  v_project_id uuid;
  v_company text;
  v_trade text;
  v_plan text;
begin
  select q.* into v_quote
  from public.quotes q
  join public.commercial_requests r on r.id = q.commercial_request_id
  where r.tracking_code = 'AZ-B311151C18'
    and q.kind = 'issued'
    and q.locked = true
  order by q.issued_at desc nulls last
  limit 1;

  if v_quote.id is null then
    select * into v_quote
    from public.quotes
    where kind = 'issued' and locked = true and status in ('sent', 'accepted')
    order by issued_at desc nulls last
    limit 1;
  end if;

  if v_quote.id is null then
    raise exception 'Aucun devis émis/verrouillé trouvé';
  end if;

  v_cfg_id := v_quote.configuration_id;
  v_prospect_id := v_quote.prospect_id;
  v_trade := coalesce(v_quote.trade_slug, 'plombier');
  v_plan := coalesce(v_quote.plan_id, 'essentiel');
  v_company := coalesce(
    nullif(trim(v_quote.client_snapshot->>'company'), ''),
    'Atelier Recette CRM'
  );

  -- Client profil : admin de recette (ou premier profil disponible)
  select id into v_client_id
  from public.profiles
  where role = 'admin'
  order by created_at
  limit 1;

  if v_client_id is null then
    select id into v_client_id from public.profiles order by created_at limit 1;
  end if;

  if v_client_id is null then
    raise exception 'Aucun profil (admin/client) — créez un compte admin avant la recette projet';
  end if;

  -- Projet déjà lié à ce prospect ?
  if v_prospect_id is not null then
    select id into v_project_id
    from public.projects
    where source_prospect_id = v_prospect_id
    limit 1;
  end if;

  if v_project_id is null then
    insert into public.projects (
      client_id, title, trade_slug, offer_tier, status, notes, source_prospect_id
    ) values (
      v_client_id,
      v_company,
      v_trade,
      v_plan,
      'design',
      'Recette soft-launch — projet créé depuis devis ' || coalesce(v_quote.reference, v_quote.id::text),
      v_prospect_id
    )
    returning id into v_project_id;
  end if;

  -- Accepter le devis (seul champ mutable contractuel utile ici)
  if v_quote.status is distinct from 'accepted' then
    update public.quotes
    set status = 'accepted', updated_at = now()
    where id = v_quote.id;
  end if;

  -- Lier la configuration au projet (le devis verrouillé garde project_id null)
  if v_cfg_id is not null then
    update public.site_configurations
    set project_id = v_project_id, status = 'submitted', updated_at = now()
    where id = v_cfg_id;
  end if;

  raise notice 'OK project=% quote=% ref=% status=accepted cfg=%',
    v_project_id, v_quote.id, v_quote.reference, v_cfg_id;
end $$;

select
  q.id as quote_id,
  q.reference,
  q.kind,
  q.status,
  q.locked,
  q.configuration_id,
  q.project_id as quote_project_id,
  sc.project_id as config_project_id,
  p.id as project_id,
  p.title,
  p.trade_slug,
  p.offer_tier
from public.quotes q
left join public.site_configurations sc on sc.id = q.configuration_id
left join public.projects p on p.id = sc.project_id
where q.kind = 'issued' and q.locked = true and q.status = 'accepted'
order by q.issued_at desc nulls last
limit 5;
