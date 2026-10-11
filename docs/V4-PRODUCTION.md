# Sites Artisans — Production des sites (Lot 6)

## Objectif

Transformer une configuration client validée en site statique autonome, sans créer 33 sites, sans second CRM, sans modifier les devis émis.

## Parcours commercial simplifié

| Usage | Rôle | Route |
|-------|------|--------|
| **Exemples de sites** | Explorer styles & formules (contenu illustratif) | `/demos` |
| **Personnaliser mon site** | Choix métier, formule, options, tarif | `/configurateur` |
| **Voir le site en grand** | Même configuration, templates démo | `/demos/:métier/:formule` |

Une seule personnalisation : `sa-configurator-v1` + sync `sa-profile`.

Pont bidirectionnel : `app/lib/configurator/bridge.ts`.

## Différence démo / configurateur

- **Démo** : galerie + prévisualisation des templates mutualisés (réutilisés en production).
- **Configurateur** : source unique des choix commerciaux et du tarif.
- Les contrôles « Ajuster l’aperçu » dans les démos synchronisent le même profil — pas un second parcours.

## Atelier admin

Route : `/admin/production` (+ fiche `/admin/production/:jobId`).

Affiche client, entreprise, métier, formule, checklist contenus, génération, hébergement.

Statuts : À préparer → Contenus incomplets → Prêt à générer → À vérifier → Validation client → Prêt à livrer → Livré.

**Lot 7 :** charge les projets CRM (`site_configurations` + devis `issued`+`accepted`) via `crmLoader.ts`, fusionne avec fixtures TEST et contenus locaux. Production livrable bloquée sans devis accepté. Export JSON + `npm run generate:site -- --job-file=…`.

Si le backend lot 5 n’est pas déployé : message honnête + fixtures TEST uniquement. **Aucune fausse réussite** de livraison.

## Réutilisation CRM

Entrées attendues (quand lot 5 opérationnel) :

- `site_configurations` (métier, formule, thème, modules, profil)
- `projects` (lien client)
- `quotes` accepté (`kind=issued`, `status=accepted`) — **snapshot immuable**

Migration préparée (non exécutée) : `supabase/migrations/20261012_v4_site_production.sql`.

## Comptes rendus de rendez-vous

Sur la fiche production :

1. Coller une transcription (Apple Notes, etc.)
2. Extraction assistée par règles (pas d’IA obligatoire)
3. Propositions : valeur actuelle / proposée / accepter / ignorer / modifier
4. Options payantes → avenant commercial, **jamais** appliquées au devis verrouillé
5. Notes internes non partagées au client par défaut

## Architecture de génération

```
ProductionJob / fixture
    → SiteBuildConfig (versionné)
    → resolveBuildModules
    → renderSiteHtml (templates Essentiel / Avancé / Pro)
    → validateGeneratedFiles (anti-secrets, anti-CRM)
    → dossier generated-sites/…
```

Modules : `app/lib/production/*`  
CLI : `npm run generate:site`

### Format SiteBuildConfig

`version`, `templateVersion`, `projectId`, `jobId`, `tradeSlug`, `planId`, identité, `modules[]`, `content`, `isTestFixture`, `generatedAt`.

### Médias

- Photos manquantes signalées (pas d’images démo silencieuses)
- Droits d’images à confirmer dans la checklist
- Optimisation responsive prévue via CSS ; assets client à injecter avant livraison

## Processus par formule

### Essentiel (priorité zéro dev spécifique)

1. Configuration validée (ou fixture TEST)
2. Compléter contenus + photos
3. `npm run generate:site -- --fixture=essentiel`
4. Vérifier `generated-sites/…/index.html`
5. Export vers l’hébergement **du client** après validation humaine

### Avancé

Même pipeline + pages `services.html`, `realisations.html`, `contact.html` + modules galerie filtrable / devis guidé.

### Pro

+ estimateur (barème à configurer), avant/après (paires client requises). Module non développé = non présenté comme fonctionnel.

## Commandes

```bash
npm run generate:site -- --fixture=essentiel
npm run generate:site -- --fixture=avance
npm run generate:site -- --fixture=pro
npm run generate:site -- --fixture=essentiel --out=generated-sites/mon-test
npm run generate:site -- --job-file=./crm_xxx.json --out=generated-sites/client
```

Shells : Essentiel `e-shell`, Avancé `sg-shell`, Pro `r-shell` (template `v4-templates-2`).  
Version livrée : poser `DELIVERED.flag` dans le dossier pour empêcher l’écrasement silencieux.

## Export & prévisualisation

- Dossier autonome (HTML/CSS + `site.json` + `README.txt`)
- `noindex` sur les prévisualisations
- Pas de ZIP automatique dans cette version (dossier prêt à archiver manuellement)
- L’admin affiche la commande réelle ; pas de bouton « Générer » fantôme

## Mise en ligne

- Client paie domaine + hébergement
- Pas de FTP automatique, pas de secrets SA dans le build
- Formulaires : service d’envoi à configurer (sinon pas de fausse confirmation)
- Réservation : lien Planity / URL fournie uniquement

## Modules nécessitant un service externe

| Module | Dépendance |
|--------|------------|
| Formulaire contact / devis | Backend ou service d’e-mail |
| Réservation | Lien Planity (ou équivalent) |
| Estimateur | Barème artisan renseigné |

## Maintenance (préparation)

Enregistrer version publiée, domaine, hébergeur, date de contrôle. Correction de texte = modifier contenus + régénérer. Évolution payante = nouveau devis / avenant.

## Limites (lots 6–7)

- Génération **locale opérationnelle** (fixtures + `--job-file`)
- Liaison CRM live : code prêt, **bloquée** tant que migrations / Edge non installées
- HTML généré ≠ composants React démo (shells alignés, pas pixel-perfect)
- Pas de déploiement automatisé ni d’hébergement de prévisualisation sécurisée
- Campagne navigateur / RLS distante : voir [`V4-RECETTE-LANCEMENT.md`](./V4-RECETTE-LANCEMENT.md)

## Suite post-lot 7

- Appliquer migrations + Edge, recette bout-en-bout
- Campagne responsive / a11y
- Partage aperçu client sécurisé
- CI de génération optionnelle
