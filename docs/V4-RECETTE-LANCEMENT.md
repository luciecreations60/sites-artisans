# Site AZ — Recette & lancement V4 (Lot 7)

Document de vérité opérationnelle. Distingue ce qui a été **réellement exécuté** de ce qui reste **bloqué**.

Marque : **Site AZ** (repo / basename GH Pages : `sites-artisans` inchangé)  
Ouverture publique cible : **1er janvier 2027** (`noindex` maintenu)  
Dernière mise à jour recette : **2026-10-26** (acceptation UI, RLS client, e-mail confirmation, a11y, pages légales)

---

## 1. Ordre d’installation Supabase (manuel)

**Ne pas exécuter automatiquement depuis ce dépôt.**

1. Vérifier CRM portal existant (`is_admin`, `prospects`, `projects`, `owns_project`).
2. Si besoin : `20261011_catalog_offers_features.sql` — **ne pas réappliquer** sur un catalogue déjà tarifé (upsert écrasant).
3. `20261012140000_v4_commercial_quotes.sql`
4. Renseigner `business_settings` (`20261022130000_v4_business_settings_site_az.sql`).
5. Déployer Edge Function `submit-commercial-request` (inclut e-mail confirmation best-effort).
6. `20261012140100_v4_site_production.sql`
7. `20261026120000_v4_client_quote_via_config.sql` — lecture client devis via `site_configurations.project_id`.
8. Tests post-apply.

### Guide Edge Function `submit-commercial-request`

```bash
npx supabase login   # ou Access Token Dashboard si GitHub 504
npx supabase link --project-ref ukmxnyqbrqjwednhqdxg
npx supabase functions deploy submit-commercial-request
```

Alternative sans CLI : édition Dashboard (préfixe `AZ-` déjà appliqué option A).  
SMTP : secrets décrits dans [`supabase/EMAIL.md`](../supabase/EMAIL.md) — sans SMTP, la demande réussit quand même (`email_sent: false`).

---

## 2. Tests automatisés réussis (local)

| Commande | Résultat 2026-10-26 |
|----------|---------------------|
| `npm run test` | **139/139 OK** (dont `acceptQuote`) |
| Tests devis (`issuedQuoteContract`, `quoteStatus`, `acceptQuote`) | **OK** |
| `npm run typecheck` | **OK** |

---

## 3. Tests navigateur

### Local (2026-10-26)

| Zone | Statut |
|------|--------|
| Accueil / offres / exemples / contact | **OK** — marque Site AZ |
| Configurateur étape parcours (490 €) | **OK** |
| Démo plombier Essentiel | **OK** |
| Skip-link + Escape ferme le menu mobile | **Code OK** — Escape + focus retour toggle ; skip-link `:focus` / `:focus-visible` |
| Admin CRM — Accepter le devis (UI) | **Code prêt** — bouton « Accepter le devis » / « Lier au projet CRM » ; à valider live après push |
| Mentions / CGV / Confidentialité | **OK** — textes soft-launch + bandeau identité provisoire ; footer → 3 pages |

### GitHub Pages post-deploy (2026-10-23 + spot 2026-10-26)

| Zone | Statut |
|------|--------|
| Accueil live | **OK** — titre / marque **Site AZ** |
| `/offres` | **OK** — 490 / 790 / 1 190 € |
| `/configurateur` | **OK** — menu mobile ouvre/ferme (session antérieure) |
| Démo `/demos/plombier/essentiel` | **OK** |
| Largeurs 768/1280/1920 systématiques | **Partiel** — CDP `Emulation.setDeviceMetricsOverride` n’applique pas les media queries (viewport reste ~980px) ; spot-check téléphone recommandé |

---

## 4. Tests Supabase réels

| Test | Statut |
|------|--------|
| Tables commercial + production | **OK** (2026-10-22) |
| Edge `submit-commercial-request` | **OK** préfixe `AZ-` — **à redéployer** pour l’e-mail confirmation |
| `business_settings` soft-launch | **OK** |
| Simulation devis créée à la demande | **OK** |
| Émission UI admin | **OK** — `D-20261023-000004` |
| Acceptation devis → projet | **SQL OK** (2026-10-22) ; **UI acceptIssuedQuote** en code — à rejouer en admin |
| Production `generate:site` depuis job CRM | **OK** |
| Loader CRM devis sans `quote.project_id` | **OK** |
| Espace client lecture devis | **OK** (2026-10-26) — `D-20261023-000004` accepted/verrouillé + config sur `/espace-client/projet/6c6e51d5-…` |

### Recette CRM courte (Lot C §5 + 2026-10-26)

1. Demande live → **fait** (`AZ-B311151C18`).
2. Émettre devis verrouillé → **fait** (UI + SQL).
3. Accepter via UI (« Accepter le devis ») → **à faire** (convertir le prospect si pas de projet, puis « Lier au projet CRM »).
4. Coller migration RLS client → **à faire**.
5. Espace client : devis visible sur la fiche projet → **à faire**.
6. Redéployer Edge + vérifier `email_sent` / réception mail → **à faire** (si SMTP configuré).

---

## 5. Anomalies

### Bloquantes pour lancement public (01/01/2027)

1. Identité légale définitive (SIRET / adresse postale) — pages légales déjà en ligne avec bandeau provisoire (`app/lib/legal.ts`).
2. Décision retrait `noindex`.

### Non bloquantes (soft-launch)

1. Auth GitHub Supabase CLI en 504 (contournement token / Dashboard OK).
2. Campagne 768/1280/1920 non instrumentée automatiquement (CDP viewport instable) — spot-check manuel téléphone recommandé.
3. Actions manuelles §6 ci-dessous (migration RLS, redéploiement Edge, recette UI acceptation).

---

## 6. Actions manuelles

- [x] Migrations commercial / production présentes
- [x] Edge Function + préfixe `AZ-`
- [x] `business_settings` soft-launch
- [x] Smoke demande commerciale live
- [x] Coller `scripts/recette-issue-quote-lotc.sql` (émission + verrouillage)
- [x] Coller `scripts/recette-accept-quote-project.sql` (acceptation + projet CRM)
- [x] Production locale : `npm run generate:site -- --job-file=scripts/recette-crm-job.json`
- [x] Push / déploiement Pages (`5d7e1a8` — Site AZ live)
- [x] Spot-check post-deploy Pages (accueil, offres, configurateur + menu mobile, démo plombier)
- [x] Coller `supabase/migrations/20261026120000_v4_client_quote_via_config.sql` (2026-10-26 — Success)
- [x] Redéployer `submit-commercial-request` (2026-10-26 — confirmation e-mail + assets `_shared/email/*`)
- [x] Projet CRM + lien config pour `D-20261023-000004` → `Atelier Test Site AZ` (`6c6e51d5-…`)
- [x] Policies client présentes : `quotes_client_select`, `site_configurations_client_select`, `quote_status_events_client_select`
- [x] Espace client UI : devis `D-20261023-000004` visible sur projet Atelier Test Site AZ (2026-10-26, session Lucie)
- [x] Pages Mentions légales / CGV / Confidentialité (soft-launch, bandeau SIRET/adresse) — spot-check local 2026-10-26

---

## 7. Décisions commerciales

- Soft-launch jusqu’au **01/01/2027** ; `noindex` conservé.
- Tarifs catalogue : ne pas modifier sans validation.

---

## 8. Conditions lancement public

1. Migrations commercial + production. ✅  
2. Edge Function opérationnelle. ✅ (redéploiement confirmation e-mail en attente)  
3. Devis émis + accepté + projet CRM ✅ (SQL) ; parcours UI acceptation en code.  
4. Site Essentiel depuis job CRM ✅ (génération locale `recette-crm-essentiel`).  
5. Campagne navigateur / a11y — spot-check OK ; Escape menu + skip-link renforcés ; largeurs auto toujours partielles.  
6. Mentions légales / CGV / confidentialité en place (2026-10-26) ; SIRET + adresse définitive encore à renseigner.  
7. Pas de secret dans export client.  
8. Décision retrait `noindex`.  
9. RLS client devis via config (`20261026120000_…`) — à appliquer.

**État : soft-launch possible ; V4 NON PRÊTE au lancement public 2027.**
