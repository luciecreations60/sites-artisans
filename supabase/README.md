# Brancher Supabase (espace client)

1. Créez un projet sur [supabase.com](https://supabase.com) (ou réutilisez celui déjà lié à GitHub).
2. **SQL Editor** → collez `supabase/schema.sql` → Run.
3. **Storage** : le script crée le bucket privé `project-docs` (vérifiez-le dans Storage).
4. **Authentication → Users** : créez votre compte admin, puis dans Table Editor `profiles` passez `role` à `admin`.
5. Créez un utilisateur client de test ; créez une ligne `projects` avec `client_id` = son uuid.
6. Dans le dépôt :

```bash
cp .env.example .env
```

Renseignez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (Settings → API).

7. `npm run dev` → `/espace-client/connexion`.

## Upload facture Indy (manuel)

1. Storage → `project-docs` → dossier `{project_id}/`
2. Upload le PDF
3. Table `documents` : `kind = facture`, `storage_path = {project_id}/nom.pdf`, `project_id`, `title`
