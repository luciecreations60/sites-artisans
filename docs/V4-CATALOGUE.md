# V4 — Catalogue & tarifs (lot 2)

## Objectif

Préparer les données, l’administration et le moteur de calcul pour le configurateur (lot 3), sans l’interface immersive.

## Fonctionnement

### Sources de données

| Situation | Source |
|-----------|--------|
| Migration Supabase absente / erreur de table | Catalogue statique `app/data/catalog/staticCatalog.ts` |
| Migration appliquée | Tables `catalog_*` + vue `catalog_features_public` |

Les pages marketing continuent d’utiliser `app/data/offers.ts`, qui **dérive** les prix depuis `STATIC_PLANS` (centimes : 49000 / 79000 / 119000).

### Types

Voir `app/data/catalog/types.ts` :

- `CatalogPlan` — formules
- `CatalogFeaturePublic` / `CatalogFeatureInternal` — séparation public / interne
- `CatalogPlanFeature` — inclusion par formule
- `CatalogTradeFeature` — recommandations métier
- `CatalogExternalProvider` — prestataires (lien / widget / api)

### Tables (migration)

Fichier : `supabase/migrations/20261011_catalog_offers_features.sql`

- `catalog_plans`
- `catalog_features`
- `catalog_feature_internals` (**admin only**, temps & rentabilité)
- `catalog_plan_features`
- `catalog_trade_features`
- `catalog_external_providers`
- Vue `catalog_features_public` (sans colonnes internes)

**Non exécutée sur la production dans ce lot.**

### Administration

Route : `/admin/catalogue` (rôle admin uniquement, layout existant).

Onglets :

1. **Formules** — modification des prix de création
2. **Fonctionnalités** — recherche, filtres, tarifs, statut, temps interne
3. **Métiers** — recommandations ordonnées

Si les tables manquent, bannière :

> Catalogue à initialiser dans Supabase

Les boutons d’enregistrement restent visibles mais **refusent** la sauvegarde (message honnête).

### Publication

- `status = draft | published`
- Une option `optional_priced` ne peut pas être publiée sans tarif
- Les modules `todo` / `study` / `optional_unpriced` ne sont pas commandables à 0 €

### Moteur de calcul

`app/lib/catalog/pricing.ts` → `calculateQuote(catalog, selection)`

Règles :

- Pas de double facturation du déjà inclus
- Pas de prix 0 pour remplacer un prix manquant
- Récurrents séparés du sous-total création
- Externes en notes (hors création)
- TVA optionnelle via `tax.vatRateBps` (aucun taux figé)
- Simulation navigateur — devis contractuels via Edge Function + `loadVerifiedCatalog()` (lot 5)
- Quantités d’options : `optionQuantities` / `feature_quantities`
- Inclusions plan×feature éditables en admin (onglet Inclusions) — pas d’auto-conversion unavailable→optional

### Personnalisation

Aucun second système : `Personalizer` / `Profile` restent la référence.
Le configurateur (lot 3) lit le catalogue public via `loadPublicCatalog()` et calcule via `calculateQuote`.

## Tests

```bash
npm run test
npm run typecheck
npm run build
npm run build:pages
```

Les tests RLS en base réelle ne sont **pas** exécutés ici (migration non appliquée). À valider sur un projet Supabase de développement après `supabase db push` / SQL editor.

## Actions manuelles restantes

1. Appliquer `20261011_catalog_offers_features.sql` sur un environnement de **dev**
2. Vérifier les policies avec un compte anon / client / admin
3. Confirmer que `catalog_feature_internals` n’est pas lisible en anon
4. Valider les prix d’options avant publication commerciale
5. Lot 3 : configurateur immersif + recommandation automatique de formule

## Cohérence STATIC vs Supabase (lot 5)

| Usage | Autorisé |
|-------|----------|
| Marketing / secours public | STATIC fallback OK |
| Simulation configurateur | STATIC ou Supabase (libellé honnête) |
| Devis contractuel / émission | Supabase uniquement (`source === "supabase"`) |

Voir aussi `docs/V4-DEVIS-CRM.md`.

## Hors lot 2 (historique)

- Configurateur / devis serveur → traités lots 3–5
- Connexions API prestataires (toujours hors scope)
