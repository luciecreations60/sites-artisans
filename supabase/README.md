# Brancher Supabase (espace client + administration)

1. Créez un projet sur [supabase.com](https://supabase.com) (ou réutilisez celui déjà lié).
2. **SQL Editor** → collez `supabase/schema.sql` → Run.
3. Si la base existait déjà avant octobre 2026, exécutez aussi  
   `supabase/migrations/20261002_portal_admin_harden.sql`.
4. **Storage** : vérifiez le bucket privé `project-docs`.
5. **Authentication → Users** : créez votre compte admin, puis dans Table Editor `profiles` passez `role` à `admin` et renseignez `full_name` (ex. `Lucie`).
6. Créez un utilisateur client de test ; créez une ligne `projects` avec `client_id` = son uuid.
7. Dans le dépôt :

```bash
cp .env.example .env
```

Renseignez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (Settings → API).

8. `npm run dev`
   - Client : `/espace-client/connexion` → `/espace-client`
   - Admin : même login → `/admin`

## Upload facture Indy (manuel)

1. Via **Administration → fiche projet → Documents**, ou
2. Storage → `project-docs` → dossier `{project_id}/` + ligne `documents`

Les URLs sont signées (bucket privé) — pas d’URL publique permanente.
