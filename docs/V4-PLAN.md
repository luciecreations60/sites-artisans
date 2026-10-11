# Sites Artisans — Plan V4

Document de pilotage pour la V4. Lots 1 et 2 sur la branche `feature/v4-sites-artisans`.

Détail catalogue : [`docs/V4-CATALOGUE.md`](./V4-CATALOGUE.md).

## Architecture actuelle (V3 → V4)

### Stack

- React 19 + TypeScript + React Router 8 (SPA)
- Vite, déploiement GitHub Pages via `.github/workflows/deploy-pages.yml` (**uniquement sur `main`**)
- Supabase : CRM prospects, espace client, admin, e-mails, conversion prospect → client
- Personnalisation démos : `localStorage` (`sa-profile`) via `app/lib/personalize.ts` + `Personalizer`

### Surfaces produit

| Zone | Routes / modules | Notes |
|------|------------------|--------|
| Marketing | `/`, `/offres`, `/comparatif`, `/demos`, `/contact`, légales | Layout `marketing-layout` + `SiteHeader` / `SiteFooter` |
| Personnalisation | `#personnaliser` sur l’accueil, profil partagé | Ne pas dupliquer : réutiliser `Personalizer` |
| Démos métier | `/demos/:trade/...` | Thèmes / médias par métier (`app/data/trades/*`) |
| Démos prospect | `/demo/:slug/...` | Contexte `ProspectDemoContext` |
| Espace client | `/espace-client/*` | Auth Supabase, projets, maintenance |
| Admin / CRM | `/admin/*` | Prospects, campagnes, clients, documents, **Catalogue & tarifs** |

### Sources de vérité commerciales

- Catalogue : `app/data/catalog/*` + migration `20261011_catalog_offers_features.sql` (non appliquée en prod)
- Marketing : `app/data/offers.ts` dérive les prix depuis `STATIC_PLANS` (49000 / 79000 / 119000 centimes)
- Moteur : `app/lib/catalog/pricing.ts` ; accès données : `app/lib/catalog/api.ts`
- `PRICING_CONFIGURATOR_LIVE` + `homeValuePropLine()` pour la phrase d’accueil
- **Ne pas** modifier les migrations antérieures ni les documents historiques Supabase

### Composants réutilisables clés

- `Personalizer` — métier, entreprise, ville, spécialité, couleurs, polices, liens démos
- `SiteHeader` / `SiteFooter` — navigation publique
- `DemoChrome`, `TradeTheme`, `Estimator` — shells démos
- Portail : `PortalHome`, `MaintenanceCard`, panneaux prospect / checklist

### Risques de régression

- Tarifs affichés hors `offers.ts` (éviter les montants en dur sur le marketing)
- Ancien discours « abonnement mensuel » / « hébergement inclus »
- Ancre `#personnaliser` et smooth scroll
- Workflow Pages : aucun push sur `main` pendant le chantier V4
- RLS / droits Supabase : lecture seule côté validation, aucune migration prod

---

## Lots prévus

### 1. Fondations et accueil — **terminé**

- Branche `feature/v4-sites-artisans`
- Nouvelle hiérarchie d’accueil + parcours en 4 étapes
- Cohérence tarifaire (création vs hébergement vs maintenance)
- Corrections responsive + images hero
- Préparation flag formulation configurateur

### 2. Catalogue de prix et fonctionnalités — **terminé (code)**

- Catalogue statique + migration SQL additive (non exécutée en prod)
- Admin `/admin/catalogue` avec comportement honnête si tables absentes
- Moteur de calcul pur + tests `npm run test`
- Recommandations des 11 métiers
- Voir `docs/V4-CATALOGUE.md`

### 3. Configurateur immersif — **suivant**

- Deux entrées (A formule / B composition → recommandation)
- Un seul moteur de calcul
- Total évolutif + récap
- Réutilisation du profil `Personalizer` (pas de second système)

### 4. Démonstrations différenciées

- Renforcer l’écart Essentiel / Avancé / Pro
- Brancher le résultat du configurateur vers la bonne démo

### 5. Devis et espace client

- Devis détaillé final
- Continuité prospect → client sans ressaisie
- Pas d’écrasement des devis historiques

### 6. Génération automatisée de sites clients

- Pipeline à partir du profil + formule validée
- Hors scope lot 1

### 7. Tests et préparation au lancement

- Parcours critique, accessibilité, build Pages
- Ouverture publique (cible indiquée 2027 sur le site)

---

## Stratégie de réutilisation — futur configurateur

### Principe

**Un seul profil de personnalisation**, celui de `Personalizer` / `Profile` (`app/lib/personalize.ts`).
Le configurateur lit et enrichit ce profil ; il ne crée pas un second stockage concurrent.

### Données déjà disponibles

| Besoin configurateur | Source existante |
|----------------------|------------------|
| Métier sélectionné | Select métier dans `Personalizer` + slug démo (`/demos/:trade`) |
| Nom d’entreprise | `Profile.company` |
| Ville | `Profile.city` |
| Spécialité | `Profile.specialty` |
| Couleurs | `Profile.themeId` → `stylePresets` |
| Typographies | `Profile.fontId` → `stylePresets` |
| Profil complet | `loadProfile` / `saveProfile` / `PROFILE_UPDATED_EVENT` |
| Navigation démos | Liens Essentiel / Avancé / Pro déjà générés depuis le slug métier |

### Deux entrées, un moteur

1. **Entrée A** — Choisir Essentiel, Avancé ou Pro (`offerPlans` / `OfferTier`)
2. **Entrée B** — Composer besoins / options → recommandation de formule

Les deux appellent le **même** moteur de calcul (à créer au lot 3) :

- options métier + formules de référence (`setupPrice`)
- total évolutif
- devis détaillé final (lot 5)

### Évitement de la double saisie

- Au démarrage du configurateur : `loadProfile()` préremplit les champs
- À chaque validation : `saveProfile()` + éventuel brouillon local dédié *uniquement* aux options tarifaires (pas aux infos d’identité)
- Les pages démos continuent d’utiliser `applyProfile`

### Flag d’accueil

Quand le moteur est prêt en production :

```ts
// app/data/offers.ts
export const PRICING_CONFIGURATOR_LIVE = true;
```

→ `homeValuePropLine()` bascule vers la formulation « tarif immédiat ».

### Hors scope immédiat

- Nouvelles tables Supabase pour le configurateur
- Migrations SQL
- Modification des politiques RLS
- Déploiement production
