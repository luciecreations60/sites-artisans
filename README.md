# Sites Artisans

Générateur de sites vitrines pour artisans (React Router 8 + Vite).

**Statut :** privé — `noindex` global. Lancement prévu au **1er janvier 2027** (création micro-entreprise).

## Démarrer

Node 22+ recommandé. Sur cette machine, Node portable :

```bash
npm install
npm run dev
```

Build statique (prerender) :

```bash
npm run build
npm run preview
```

Photos démo (Unsplash, licence Unsplash) :

```bash
node scripts/download-photos.mjs
```

## Contenu

- Site commercial : offres Essentiel / Avancé / Pro, comparatif, contact, pages légales
- **12 métiers** × 3 démos
- Personnalisation démo via `localStorage` (formulaire sur `/demos`)
- Espace client : page d’attente + schéma Supabase dans `supabase/schema.sql`

## Espace client (Supabase)

Voir `supabase/README.md` : schéma SQL, auth, bucket `project-docs`, variables `.env`.
