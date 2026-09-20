# Évolutions V2

Cette version conserve le rendu Emergent et ajoute une couche indépendante dans `static/custom/`.

## Correctifs
- Boutons d'ancrage du site principal (`Découvrir les offres`, `Voir les démonstrations`) compatibles avec `HashRouter` sur GitHub Pages.
- Aucun changement visuel sur les trois démos existantes.

## Nouvelle expérience commerciale
Une section « Et si vous pouviez déjà vous voir dans votre futur site ? » est ajoutée sous le hero.
Le prospect peut renseigner :
- son métier ;
- le nom de son entreprise ;
- sa ville / zone ;
- son prénom ;
- sa spécialité principale (facultatif).

Les informations sont conservées uniquement dans le navigateur (`localStorage`) et servent à personnaliser les trois démos.

## Métiers prédéfinis
- menuisier / agenceur ;
- plombier / chauffagiste ;
- électricien ;
- couvreur / zingueur ;
- peintre / décorateur ;
- paysagiste ;
- maçon ;
- garage / mécanicien ;
- boulanger / pâtissier ;
- coiffeur / barbier ;
- beauté / bien-être ;
- autre activité artisanale.

Chaque métier dispose de :
- textes d'accroche adaptés ;
- 4 services adaptés ;
- titres de réalisations adaptés ;
- sélection de photographies dédiée.

## Limitation technique actuelle
Le projet d'origine a été récupéré depuis le bundle compilé d'Emergent, pas depuis les fichiers React sources. La personnalisation est donc ajoutée comme couche DOM autonome, ce qui permet de préserver fidèlement le rendu actuel.

La prochaine vraie étape de développement peut être la reconstruction React/Vite propre des sources, avec ces presets directement dans `src/config/`.
