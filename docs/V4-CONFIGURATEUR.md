# V4 — Configurateur immersif (lot 3)

## Route

`/configurateur` — layout marketing existant, compatible base path GitHub Pages.

Entrées :

| Source | Paramètres |
|--------|------------|
| Accueil CTA | `/configurateur` |
| Offres / cartes | `?formule=essentiel\|avance\|pro&parcours=formula` |
| Démos | `?metier=:slug&formule=:tier&parcours=formula` |

## Parcours (5 étapes)

1. Métier (11 slugs `TRADE_SLUGS`)
2. Parcours : formule prête **ou** composition libre (pas de 4ᵉ formule « sur mesure »)
3. Identité entreprise → même `Profile` / `Personalizer` (`sa-profile`)
4. Fonctionnalités (recommandées métier + catalogue)
5. Récapitulatif + contact

## Architecture

| Module | Rôle |
|--------|------|
| `app/routes/configurateur.tsx` | Page |
| `app/components/configurator/ConfiguratorApp.tsx` | Assistant |
| `SitePreview.tsx` | Miniature visuelle live |
| `PricePanel.tsx` | Tarif évolutif |
| `app/lib/configurator/storage.ts` | Persistancelocale `sa-configurator-v1` + sync Profile |
| `app/lib/configurator/recommend.ts` | Comparaison / recommandation formules |
| `app/lib/catalog/api.ts` + `pricing.ts` | Catalogue + calcul (lot 2) |

## Calcul

- Toujours via `calculateQuote` (centimes).
- Options sans prix / étude → total **partiel**, jamais 0 € silencieux.
- Hébergement / maintenance / externes présentés séparément.
- TVA : aucun taux inventé (paramètre `vatRateBps` seulement si fourni).

## Recommandation

`recommendPlans` compare Essentiel / Avancé / Pro pour les besoins sélectionnés.

- Ne recommande **que** si le scénario est complet (pas d’options non chiffrées).
- Calcule une économie réelle vs formule courante si pertinente.
- Ne favorise pas Pro par défaut.

## Sauvegarde

Clé `sa-configurator-v1` (versionnée).

Contient : étape, métier, parcours, formule, options, profil.

Au rechargement, les **prix sont recalculés** depuis le catalogue (jamais un total stocké comme vérité).

Confirmation avant « Recommencer ».

## Aperçu

Miniature HTML/CSS :

- Couleurs / polices du profil
- Image métier
- Sections selon formule + features `ready` déjà présentes dans les démos

Pas de faux modules pour fonctionnalités non développées.

## Contact

`/contact?from=configurateur` + `sessionStorage` récap.

Mailto inclut le récap — pas de prétention d’envoi serveur (lot 5).

## Supabase

Lecture publique uniquement (`catalog_*` / vue publique).

Pas d’accès aux internals (temps, marges).

Fallback statique si indisponible, avec message honnête.

## Flag

`PRICING_CONFIGURATOR_LIVE = true` → phrase d’accueil définitive activée.

## Lien vers les démos (lots 4 + 6)

Étape 5 — bouton **Voir le site en grand** :

- URL : `/demos/{tradeSlug}/{planId}`
- Persistance : `saveConfiguratorState` synchronise aussi `sa-profile`
- Modules démo : `resolveDemoModules` lit `sa-configurator-v1`
- Retour démo → configurateur : `configuratorHrefFromDemo` + `etape` (pont `bridge.ts`)
- Libellés UX : « Personnaliser mon site », « Exemples de sites », « Revenir à ma configuration »

Détail templates : [`docs/V4-DEMOS.md`](./V4-DEMOS.md). Production : [`docs/V4-PRODUCTION.md`](./V4-PRODUCTION.md).

## Demande commerciale (lot 5)

- Étape 5 : récapitulatif détaillé + lien `/configurateur/demande`
- Simulation imprimable : `/configurateur/simulation`
- Envoi : Edge Function `submit-commercial-request` (recalcul serveur)
- Détail : [`docs/V4-DEVIS-CRM.md`](./V4-DEVIS-CRM.md)

## Limites / lots suivants

- Lot 4 : différenciation Essentiel / Avancé / Pro — **livré**
- Lot 5 : devis / CRM — **livré (code)** ; migrations + Edge Function à déployer manuellement
- Lot 6 : génération de sites à partir de `site_configurations`
- Pas de validation contractuelle purement navigateur
