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

## Limites / lots suivants

- Lot 4 : différenciation visuelle poussée Essentiel / Avancé / Pro
- Lot 5 : devis serveur, CRM, PDF, pas de paiement ici
- Pas de validation contractuelle navigateur
