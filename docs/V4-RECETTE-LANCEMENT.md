# Site AZ — Recette & lancement V4 (Lot 7)

Document de vérité opérationnelle. Distingue ce qui a été **réellement exécuté** de ce qui reste **bloqué**.

Marque : **Site AZ** (repo / basename GH Pages : `sites-artisans` inchangé)  
Ouverture publique cible : **1er janvier 2027** (`noindex` maintenu)  
Dernière mise à jour recette : **2026-10-22** (session Lot C + soft-launch)

---

## 1. Ordre d’installation Supabase (manuel)

**Ne pas exécuter automatiquement depuis ce dépôt.**

1. Vérifier CRM portal existant (`is_admin`, `prospects`, `projects`, `owns_project`).
2. Si besoin : `20261011_catalog_offers_features.sql` — **ne pas réappliquer** sur un catalogue déjà tarifé (upsert écrasant).
3. `20261012140000_v4_commercial_quotes.sql`
4. Renseigner `business_settings` (`20261022130000_v4_business_settings_site_az.sql`).
5. Déployer Edge Function `submit-commercial-request`.
6. `20261012140100_v4_site_production.sql`
7. Tests post-apply.

### Guide Edge Function `submit-commercial-request`

```bash
npx supabase login   # ou Access Token Dashboard si GitHub 504
npx supabase link --project-ref ukmxnyqbrqjwednhqdxg
npx supabase functions deploy submit-commercial-request
```

Alternative sans CLI : édition Dashboard (préfixe `AZ-` déjà appliqué option A).

---

## 2. Tests automatisés réussis (local)

| Commande | Résultat 2026-10-22 |
|----------|---------------------|
| `npm run test` | **133/133 OK** |
| Tests devis (`issuedQuoteContract`, `quoteStatus`) | **15/15 OK** |
| `npm run typecheck` | **OK** |

---

## 3. Tests navigateur (local Site AZ)

| Zone | Largeur | Statut 2026-10-22 |
|------|---------|-------------------|
| Accueil | Desktop + menu mobile présent | **OK** — marque Site AZ |
| Configurateur 5 étapes | Métier → formule Essentiel → identité → récap 490 € | **OK** |
| `/configurateur/demande` | Formulaire prérempli + 490 € | **OK** |
| Démo plombier Essentiel | Contenu + chrome (nom perso appliqué) | **OK** |
| `/offres` | 490 / 790 / 1 190 € | **OK** |
| `/comparatif` | Charge | **OK** |
| `/contact` | `contact@site-az.fr` | **OK** |
| `/espace-client/connexion` | Formulaire Site AZ | **OK** |
| Campagne 375/768/1280/1920 systématique | Emulation CDP instable | **Partiel** — menu toggle vu sur viewport étroit configurateur |
| Admin CRM UI (émettre devis) | — | **NON EXÉCUTÉ** (pas de session admin dans le navigateur agent) |

GH Pages publie encore l’ancien libellé tant que pas de push.

---

## 4. Tests Supabase réels

| Test | Statut 2026-10-22 |
|------|-------------------|
| Tables commercial + production | **OK** (HTTP 200 REST) |
| Edge `submit-commercial-request` | **OK** — `AZ-B311151C18` (recette CRM) / `AZ-32A5B571C6` (préfixe) |
| `business_settings` soft-launch | **OK** (appliqué manuellement) |
| Simulation devis créée à la demande | **OK** (insert Edge `kind=simulation`) |
| Émission + verrouillage live | **OK** — SQL `recette-issue-quote-lotc.sql` exécuté (2026-10-22) |
| Acceptation devis → projet | **OK** — SQL `recette-accept-quote-project.sql` exécuté (2026-10-22) |
| Production `generate:site` depuis job CRM | **OK** — `generated-sites/recette-crm-essentiel` (`scripts/recette-crm-job.json`) |
| Loader CRM devis sans `quote.project_id` | **OK** — fix `crmLoader` (lien via `configuration_id`) |
| Espace client lecture devis | **NON EXÉCUTÉ** |

### Recette CRM courte (Lot C §5)

1. Demande live → **fait** (`AZ-B311151C18`, prospect + configuration + simulation).
2. Émettre devis verrouillé → **fait** (SQL Editor `recette-issue-quote-lotc.sql`).
3. Vérifier `kind=issued`, `locked=true`, `reference` type `D-YYYYMMDD-NNNNNN` → **fait** (confirmé utilisateur).

---

## 5. Anomalies

### Bloquantes pour lancement public (01/01/2027)

1. Identité légale définitive (SIRET / adresse).
2. Au moins un devis émis + accepté de bout en bout (UI admin).
3. Campagne largeurs complète post-deploy Site AZ.
4. Décision retrait `noindex`.

### Non bloquantes (soft-launch)

1. Push Pages Site AZ en fin de journée.
2. Auth GitHub Supabase CLI en 504 (contournement token / Dashboard OK).
3. Pas d’e-mail transactionnel de confirmation de demande.

---

## 6. Actions manuelles

- [x] Migrations commercial / production présentes
- [x] Edge Function + préfixe `AZ-`
- [x] `business_settings` soft-launch
- [x] Smoke demande commerciale live
- [x] Coller `scripts/recette-issue-quote-lotc.sql` (émission + verrouillage)
- [x] Coller `scripts/recette-accept-quote-project.sql` (acceptation + projet CRM)
- [x] Production locale : `npm run generate:site -- --job-file=scripts/recette-crm-job.json`
- [ ] Push / déploiement Pages (fin de journée)
- [ ] Campagne responsive post-deploy

---

## 7. Décisions commerciales

- Soft-launch jusqu’au **01/01/2027** ; `noindex` conservé.
- Tarifs catalogue : ne pas modifier sans validation.

---

## 8. Conditions lancement public

1. Migrations commercial + production. ✅  
2. Edge Function opérationnelle. ✅  
3. Devis émis + accepté + projet CRM ✅.  
4. Site Essentiel depuis job CRM ✅ (génération locale `recette-crm-essentiel`).  
5. Campagne navigateur / a11y.  
6. Mentions légales / émetteur complets.  
7. Pas de secret dans export client.  
8. Décision retrait `noindex`.

**État : soft-launch possible ; V4 NON PRÊTE au lancement public 2027.**
