# Sites Artisans — Devis & CRM (Lot 5)

Parcours commercial entre configurateur, recalcul sécurisé, CRM et devis.

## Parcours

1. Configuration locale (`sa-configurator-v1` + `sa-profile`) — aucun compte requis  
2. Récapitulatif détaillé (étape 5 + `/configurateur/simulation`)  
3. Formulaire `/configurateur/demande`  
4. Edge Function `submit-commercial-request` : recalcul serveur + prospect + config + simulation  
5. CRM fiche prospect → panneau **Configurateur V4**  
6. Brouillon → émission devis (snapshot verrouillé)  
7. Conversion prospect → client (existant) + projet pour lot 6  

## Modèle

| Table | Rôle |
|-------|------|
| `site_configurations` | Snapshot métier / formule / options / profil / pricing |
| `commercial_requests` | Intake public (tracking, montants serveur) |
| `quotes` | simulation / draft / issued (+ `locked`) |
| `business_settings` | Régime TVA, identité légale émetteur |
| `commercial_request_rate_limits` | Anti-spam |

Migration : `supabase/migrations/20261012_v4_commercial_quotes.sql` (additive, **non exécutée** automatiquement).

## Calcul sécurisé

- Navigateur : `calculateQuote` = simulation  
- Serveur : `_shared/catalogPricing.ts` sur catalogue Supabase uniquement  
- Total navigateur ignoré (`client_claimed_creation_cents` informatif)  
- Quantités : `feature_quantities` (plafond 99)  
- `loadVerifiedCatalog()` côté app refuse le fallback pour usage contractuel  

## TVA

`business_settings.tax_regime` :

- `unknown` — pas d’émission de devis officiel  
- `franchise` — pas de TVA calculée  
- `liable` — `vat_rate_bps` + `vat_number` requis  

Aucun taux 20 % figé dans le code.

## Documents

- Simulation : page imprimable `/configurateur/simulation` (mention non contractuelle)  
- Devis émis : snapshot JSON + impression navigateur  
- Pas de bibliothèque PDF lourde ; uploads `documents.kind = devis` restent possibles  

## Sécurité / RLS

- Tables commerciales : admin (`is_admin`)  
- Client : SELECT devis `issued` liés à un projet `owns_project`  
- Intake : Edge Function `service_role` uniquement  
- Pas d’insertion anonyme directe depuis le navigateur  
- Rate limit par hash IP+e-mail  
- Idempotence `client_request_id`  

## Catalogue vs STATIC

| Surface | Source |
|---------|--------|
| Marketing offres | STATIC (référence) |
| Configurateur | Supabase si prêt, sinon fallback simulation |
| Démos modules | STATIC inclusions (+ options configurateur) |
| Devis contractuel | Supabase obligatoire |

Arbitrages `unavailable` → `optional` : admin Catalogue → onglet **Inclusions** (appliqués manuellement).

## Données lot 6

`site_configurations` doit contenir au minimum :

- `trade_slug`, `plan_id`, `desired_feature_ids`, `feature_quantities`  
- `theme_id`, `font_id`, `profile_snapshot`  
- `pricing_snapshot` / `catalog_fingerprint`  

Lien `project_id` après conversion.

## Installation manuelle

1. Appliquer `20261011_catalog_offers_features.sql` si besoin  
2. Appliquer `20261012_v4_commercial_quotes.sql`  
3. Déployer Edge Function `submit-commercial-request`  
4. Renseigner `business_settings` (légal + TVA)  
5. Tester une demande depuis `/configurateur/demande`  

## Limitations

- E-mail de confirmation prospect : non envoyé automatiquement  
- PDF natif : impression navigateur  
- Fusion prospects : e-mail exact uniquement ; ambiguïté → nouvelle fiche + note admin  
- Sans migration : formulaire affiche l’échec sans fausse confirmation  
