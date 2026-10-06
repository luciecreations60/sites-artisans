# Sites Artisans

Générateur de sites vitrines pour artisans (React Router 8 + Vite).

**Statut :** privé — `noindex` global. Lancement prévu au **1er janvier 2027**.

**En ligne (GitHub Pages) :** https://luciecreations60.github.io/sites-artisans/

## Branches

| Branche | Contenu |
|---|---|
| `main` | Version actuelle (V3 React + espace client) |
| `archive/v2-main` | Ancien site Studio Fontaine / Emergent (historisé) |
| `cursor/cloud-agent-…` | Branche de travail Cloud Agent (historique du chantier) |

## Démarrer

Node 22+ recommandé.

```bash
npm install
npm run dev
```

Build local :

```bash
npm run build
npm run preview
```

Build pour GitHub Pages :

```bash
set GITHUB_PAGES=true
npm run build
```

Photos démo (Unsplash) :

```bash
npm run photos
```

Nommage dans `public/img/{métier}/` : `essentiel_1…5`, `avance_1…8`, `pro_1…9`.  
Guide de remplacement : `public/img/GUIDE.md` (et un `GUIDE.md` dans chaque métier).

## Contenu

- Site commercial : offres Essentiel / Avancé / Pro, comparatif, contact, pages légales
- **11 métiers** × 3 démos + personnalisation (profil, couleurs, polices)
- Espace client Supabase (auth, projets, documents / factures PDF)

## Espace client (Supabase)

Voir `supabase/README.md`. Variables dans `.env` (local) ou secrets GitHub Actions :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
