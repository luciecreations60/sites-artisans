# Sites Artisans — Recette & lancement V4 (Lot 7)

Document de vérité opérationnelle. Distingue ce qui a été **réellement exécuté** de ce qui reste **bloqué**.

Branche : `feature/v4-sites-artisans`  
Date de rédaction : 2026-10-12

---

## 1. Ordre d’installation Supabase (manuel)

**Ne pas exécuter automatiquement depuis ce dépôt.**

1. Vérifier CRM portal existant (`is_admin`, `prospects`, `projects`, `owns_project`).
2. Si besoin : `20261011_catalog_offers_features.sql` — **ne pas réappliquer** sur un catalogue DEV déjà tarifé (upsert écrasant).
3. `20261012140000_v4_commercial_quotes.sql` (rate-limit 0→+1, triggers SECURITY DEFINER, `admin_next_quote_reference`).
4. Renseigner `business_settings` (raison sociale, adresse, ville, régime TVA).
5. Déployer Edge Function `submit-commercial-request` (voir §2).
6. `20261012140100_v4_site_production.sql` (FK config/devis, validation issued+accepted+locked).
7. Tests post-apply listés §3.

### Guide Edge Function `submit-commercial-request`

```bash
# Depuis la machine avec CLI Supabase liée au projet DEV
supabase functions deploy submit-commercial-request
```

Vérifications :
- Secrets projet : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (injectés par la plateforme).
- Appel depuis `/configurateur/demande` → HTTP 200 + `tracking_code`.
- Si tables absentes → HTTP 503 `migration_pending` (comportement honnête).
- Rate-limit : 9ᵉ appel / heure / bucket → refus.

CORS : autoriser l’origine GitHub Pages / preview utilisée.

---

## 2. Tests automatisés réussis (local)

Commandes exécutées lors du lot 7 :

| Commande | Résultat attendu |
|----------|------------------|
| `npm run test` | Tous verts (incl. CRM loader, parité 33 combos, XSS) |
| `npm run typecheck` | OK |
| `npm run build` | OK |
| `npm run build:pages` | OK |
| `npm run generate:site -- --fixture=essentiel` | Dossier généré |
| `npm run generate:site -- --fixture=avance` | Multipage |
| `npm run generate:site -- --fixture=pro` | Shell `r-shell` + modules Pro |

Couverture unitaire notable :
- Pont démo ↔ configurateur
- Rate-limit / devis verrouillé / contrat issued
- Éligibilité production + checklist + CR
- Génération Essentiel / Avancé / Pro
- Parité 33 combinaisons (shell + pages)
- Échappement HTML
- Mapping CRM → job + bloqueurs

---

## 3. Tests navigateur

| Zone | 375–1920 | Statut |
|------|----------|--------|
| Accueil / offres / démos / configurateur | Campagne visuelle | **NON EXÉCUTÉE** dans cette session agent (pas de campagne navigateur complète enregistrée) |
| Sites générés (fixtures) | Structure HTML/CSS responsive déclarative | **Partiel** (media queries + tests structure) |
| CRM admin | — | **NON EXÉCUTÉ** (nécessite compte admin + backend) |

Ne pas considérer la V4 « validée responsive » tant que la campagne navigateur n’a pas été faite manuellement.

---

## 4. Tests Supabase réels

| Test | Statut |
|------|--------|
| Application migration commercial | **BLOQUÉ** — non exécuté depuis l’agent |
| Application migration production | **BLOQUÉ** |
| Déploiement Edge Function | **BLOQUÉ** |
| RLS anon / client / admin | **BLOQUÉ** |
| Soumission demande commerciale live | **BLOQUÉ** |
| Émission devis + référence unique | **BLOQUÉ** |
| Lecture devis côté espace client | **BLOQUÉ** (UI prête, backend requis) |
| Chargement projets dans `/admin/production` | **BLOQUÉ** live ; fixtures OK |

---

## 5. Anomalies

### Bloquantes pour lancement public

1. Migrations lot 5 / 6 non appliquées sur DEV.
2. Edge Function non déployée → demandes commerciales impossibles en live.
3. Campagne navigateur / a11y non réalisée.
4. Coordonnées légales émetteur (`business_settings`) à confirmer avant devis émis.
5. Générateur = HTML/CSS shells alignés, **pas** les composants React démo pixel-perfect (écart qualité documenté).

### Non bloquantes

1. Pas de ZIP automatique à l’export.
2. Aperçu production non partagé dans l’espace client (état explicite).
3. FK SQL `configuration_id` / `accepted_quote_id` sur jobs production encore libres.
4. Pas d’e-mail transactionnel de confirmation de demande.

---

## 6. Actions manuelles

- [ ] Appliquer migrations dans l’ordre §1
- [ ] Déployer Edge Function
- [ ] Remplir `business_settings`
- [ ] Recette CRM : demande → devis → acceptation → projet
- [ ] Recette production : job CRM → export JSON → `generate:site --job-file`
- [ ] Campagne responsive / clavier / contrastes
- [ ] Décider date d’ouverture publique et indexation

---

## 7. Décisions commerciales à confirmer

- Tarifs catalogue DEV déjà renseignés : **ne pas modifier** sans validation.
- Ouverture publique (cible site : 2027) vs soft-launch.
- Prestataire formulaire de contact des sites clients.
- Hébergement de prévisualisation sécurisée (si besoin hors dossier local).

---

## 8. Conditions pour considérer la V4 prête au lancement

Toutes les conditions suivantes doivent être **vraies** :

1. Migrations commercial + production appliquées sans erreur.
2. Edge Function opérationnelle (test réel de demande).
3. Au moins un devis émis + accepté de bout en bout.
4. Un site Essentiel généré depuis un job CRM (pas seulement fixture).
5. Campagne navigateur responsive + a11y sans anomalie bloquante.
6. Mentions légales / confidentialité / identité émetteur complètes.
7. Aucune clé secrète dans un export client.
8. Décision explicite d’ouverture (retrait `noindex` du site commercial uniquement).

**État actuel : V4 NON PRÊTE au lancement public.**  
Travail local lots 1–7 abouti ; intégration Supabase et recette navigateur restantes.
