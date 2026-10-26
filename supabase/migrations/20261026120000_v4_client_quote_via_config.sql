-- V4 soft-launch — lecture client des devis via site_configurations.project_id
-- Prérequis : 20261012140000_v4_commercial_quotes.sql déjà appliqué.
-- Contexte : quotes.project_id est immuable après verrouillage (souvent null) ;
-- le lien CRM se fait sur site_configurations.project_id après acceptation / conversion.
-- Appliquer manuellement (SQL Editor) — ne pas lancer depuis le dépôt.

-- Configurations liées à un projet du client
drop policy if exists site_configurations_client_select on public.site_configurations;
create policy site_configurations_client_select on public.site_configurations
  for select using (
    project_id is not null
    and public.owns_project(project_id)
  );

-- Devis émis : via quotes.project_id OU via configuration liée au projet
drop policy if exists quotes_client_select on public.quotes;
create policy quotes_client_select on public.quotes
  for select using (
    kind = 'issued'
    and (
      (
        project_id is not null
        and public.owns_project(project_id)
      )
      or (
        configuration_id is not null
        and exists (
          select 1
          from public.site_configurations sc
          where sc.id = configuration_id
            and sc.project_id is not null
            and public.owns_project(sc.project_id)
        )
      )
    )
  );

-- Historique statut : même règle
drop policy if exists quote_status_events_client_select on public.quote_status_events;
create policy quote_status_events_client_select on public.quote_status_events
  for select using (
    exists (
      select 1
      from public.quotes q
      where q.id = quote_id
        and q.kind = 'issued'
        and (
          (
            q.project_id is not null
            and public.owns_project(q.project_id)
          )
          or (
            q.configuration_id is not null
            and exists (
              select 1
              from public.site_configurations sc
              where sc.id = q.configuration_id
                and sc.project_id is not null
                and public.owns_project(sc.project_id)
            )
          )
        )
    )
  );

comment on policy site_configurations_client_select on public.site_configurations is
  'Client : lecture des configs liées à un projet qu’il possède';
comment on policy quotes_client_select on public.quotes is
  'Client : devis issued via project_id direct ou via site_configurations.project_id';
