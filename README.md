# Site artisans — version récupérée depuis Emergent

Cette archive contient une version autonome du site généré dans Emergent, préparée pour GitHub Pages.

## Publication rapide

1. Créez un dépôt GitHub vide.
2. Envoyez **le contenu de ce dossier à la racine** du dépôt (pas le dossier lui-même dans un sous-dossier).
3. Dans GitHub : **Settings > Pages**.
4. Dans **Build and deployment**, choisissez **Deploy from a branch**.
5. Branche : `main` ; dossier : `/ (root)`.
6. Enregistrez.

## Navigation

Cette version utilise un `HashRouter` pour être compatible avec GitHub Pages, même quand le site se trouve dans un sous-répertoire.

Exemples :
- `#/demo/essentiel`
- `#/demo/signature`
- `#/demo/rayonnement`

Le rendu et le contenu restent ceux de la version Emergent ; seule la forme des URL change.

## Contenu du projet

- `index.html` : document principal et SEO de base
- `404.html` : secours GitHub Pages
- `static/js/bundle.js` : application React/Webpack récupérée depuis la prévisualisation Emergent
- `source-reference/styles/` : CSS sources récupérés depuis les outils développeur
- `.nojekyll` : évite le traitement Jekyll de GitHub Pages

## Important pour les prochaines modifications

`bundle.js` est un bundle de développement compilé. Il permet de conserver très fidèlement le site actuel, mais ce n'est pas la forme idéale pour modifier durablement le projet.

Les fichiers React d'origine n'étaient pas disponibles sous forme de sources séparées et le fichier `bundle.js.map` n'était pas accessible. Une reconstruction propre en React/Vite pourra être faite ensuite à partir du bundle et des CSS récupérés, sans repartir visuellement de zéro.

## Version V2 — immersion prospect
Cette copie ajoute `static/custom/enhancements.js` et `enhancements.css` : correctifs des boutons d'ancrage sous GitHub Pages et personnalisation des démos selon le métier du prospect. Voir `EVOLUTIONS_V2.md`.
