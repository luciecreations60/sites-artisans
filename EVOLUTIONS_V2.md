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

## Correctifs V2.1
- Les liens `#/#offres`, `#/#demos`, etc. (pied de page, carte du hero) défilent vers la section au lieu d'être traités comme une route ; seuls les identifiants de section connus sont interceptés.
- Le formulaire exige l'entreprise, la ville et le prénom, affiche un message accessible et n'enregistre plus de profil vide ; « Réinitialiser » vide aussi les champs pré-remplis.
- Les boutons « Voir Essentiel / Signature / Rayonnement » enregistrent automatiquement le profil saisi.
- La personnalisation passe par `setTimeout` : elle fonctionne aussi dans un onglet ouvert en arrière-plan.
- Pour un métier autre que menuisier, les textes « bois / atelier / meuble » écrits en dur dans les démos (histoire, valeurs, projets, avis, estimateur, titres de page) sont adaptés au métier choisi.
- L'e-mail de démonstration devient `contact@nom-de-l-entreprise.fr`, y compris dans les liens `mailto:`.
- Remplacements en une seule passe (du plus long au plus court) : plus de doubles remplacements ni de « l'Dupont ».
- Ajout du fichier `.nojekyll` mentionné dans le README.

## Limitation technique actuelle
Le projet d'origine a été récupéré depuis le bundle compilé d'Emergent, pas depuis les fichiers React sources. La personnalisation est donc ajoutée comme couche DOM autonome, ce qui permet de préserver fidèlement le rendu actuel.

La prochaine vraie étape de développement peut être la reconstruction React/Vite propre des sources, avec ces presets directement dans `src/config/`.
