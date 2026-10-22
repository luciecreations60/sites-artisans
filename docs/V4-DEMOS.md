# Site AZ — Démonstrations V4 (Lot 4)

Architecture des 33 démos (11 métiers × 3 formules) sans dupliquer 33 sites.

## Principe

| Couche | Rôle | Où |
|--------|------|-----|
| A. Structure | Sections / pages / navigation | Templates `demos.essentiel`, layout Avancé / Pro |
| B. Identité visuelle | Couleurs, typos, compositions | Shells CSS `.e-shell` / `.sg-shell` / `.r-shell` + `TradeTheme` |
| C. Contenu métier | Prestations, projets, CTA | `app/data/trades/*` |
| D. Données client | Nom, ville, couleurs… | `Profile` (`sa-profile`) via Personalizer / configurateur |
| E. Fonctionnalités | Modules actifs | `resolveDemoModules` + catalogue |

Un nouveau client Essentiel standard = renseigner le profil + médias + éventuelles options, sans recréer le site.

## Routes

- Essentiel (one-page) : `/demos/:trade/essentiel`
- Avancé (multipage) : `/demos/:trade/avance`, `/services`, `/realisations`, `/contact`, `/devis`
- Pro (multipage premium) : `/demos/:trade/pro`, `/services`, `/realisations`, `/realisations/:id`, `/contact`, `/devis`

Navigation entre formules : `DemoChrome` (conservée). Retour configurateur : liens chrome + CTA.

## Différenciation visuelle

| Formule | Shell | Caractère |
|---------|-------|-----------|
| Essentiel | `.e-shell` | Clair, sobre, hero 2 colonnes, galerie 3 projets, CTA téléphone |
| Avancé | `.sg-shell` | Éditorial, overlap photo, cartes asymétriques, bandeaux, multipage |
| Pro | `.r-shell` | Premium immersif (toile sombre + accent métier), hero plein cadre, showcase asymétrique, modules avancés |

Les couleurs `Profile.themeId` influencent `--trade-*` ; Pro conserve une toile sombre lisible tout en teintant l’accent.

## Modules réutilisables

- `BeforeAfter` — curseur horizontal (pointeur, tactile, clavier), libellés Avant/Après, mode illustratif
- `Estimator` — barème `trade.estimator` (prestations artisan, **pas** le prix Site AZ)
- `DemoModulesNote` — options configurateur sans composant démo
- `resolveDemoModules(tier)` — inclusions catalogue + options compatibles

### Inclusions par défaut (catalogue statique)

- Essentiel : galerie simple, témoignages, zone, contact — pas de filtres / BA / estimateur / devis guidé
- Avancé : + galerie filtrable + devis guidé
- Pro : + avant/après + estimateur

Options incompatibles lors d’un changement de formule → listées dans `DemoModulesNote`, non simulées.

## Configurateur ↔ exemples (lot 6)

- Galerie : `/demos` — « Exemples de sites » + « Personnaliser ce modèle »
- Chrome démo : conserve métier/formule/profil au changement de formule (`persistDemoEntry`)
- Retour : « Revenir à ma configuration » → `/configurateur?…&etape=5`
- Personalizer immersive enregistre dans `sa-configurator-v1` (plus seulement `sa-profile`)

Étape 5 configurateur : **Voir le site en grand** → `/demos/{métier}/{formule}`.

Les démos lisent les modules via `localStorage` `sa-configurator-v1`.

## Estimateur

- Données : `trade.estimator.options[]` (`base`, `unit`, `label`)
- Si barème absent ou base ≤ 0 → pas de faux montant, CTA devis
- Mode démo : libellé « (exemple) » / non contractuel

## Avant / après

- Une seule implémentation `BeforeAfter`
- Paires `project.before` / `project.after` quand présentes
- Sinon `BeforeAfterPlaceholder` (pas de fausse transformation)

## Production client Essentiel

Voir la procédure complète : [`docs/V4-PRODUCTION.md`](./V4-PRODUCTION.md).

Résumé : fiche `/admin/production` → contenus → `npm run generate:site` → validation humaine → hébergement client.

## Ajouter un métier

1. Créer `app/data/trades/{slug}.ts` conforme à `TradeData`
2. Enregistrer dans `TRADE_SLUGS` / `trades`
3. Ajouter assets sous `public/` (chemins relatifs base `/sites-artisans/`)
4. Optionnel : recommandations `STATIC_TRADE_FEATURES`
5. Les 3 templates s’adaptent automatiquement

## Ajouter un module

1. Feature dans le catalogue (`STATIC_FEATURES` + inclusions)
2. Composant UI mutualisé
3. Brancher dans `IMPLEMENTED` + `resolveDemoModules`
4. Conditionner l’affichage dans le(s) template(s)
5. Documenter ici si indisponible sur certaines formules

## Tests

```bash
npm run test
npm run typecheck
npm run build
npm run build:pages
```

`demoModules.test.ts` couvre les 33 combinaisons + cas d’incompatibilité.

## Limites restantes

- Pas toutes les features catalogue ont un composant démo (signalées honnêtement)
- Assets avant/après incomplets sur certains métiers → placeholder
- Revue visuelle navigateur manuelle recommandée avant lot 5
- Pas de push / déploiement / SQL prod dans ce lot
