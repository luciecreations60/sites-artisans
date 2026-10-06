# Brancher Supabase (espace client + administration + CRM)

1. Créez un projet sur [supabase.com](https://supabase.com) (ou réutilisez celui déjà lié).
2. **SQL Editor** → collez `supabase/schema.sql` → Run  
   (ou, base déjà existante : exécutez les migrations dans l’ordre).
3. Si la base existait déjà avant le socle Admin / Espace client, exécutez aussi :
   - `supabase/migrations/20261002_portal_admin_harden.sql`
   - `supabase/migrations/20261003_fix_role_guard_for_sql_editor.sql` (si besoin)
4. **CRM Phase 1** (prospects) — si la base existait déjà sans CRM :
   exécutez `supabase/migrations/20261004_crm_prospects_phase1.sql`
5. **CRM Phase 2** (démos personnalisées) — après la Phase 1 :
   exécutez `supabase/migrations/20261005_crm_prospect_demos_phase2.sql`
6. **CRM Phase 3** (e-mails + campagnes) — après la Phase 2 :
   exécutez `supabase/migrations/20261006_crm_prospect_emails_phase3.sql`
   puis déployez les Edge Functions et configurez les secrets SMTP — voir [EMAIL.md](./EMAIL.md)
7. **Storage** : vérifiez le bucket privé `project-docs`.
8. **Authentication → Users** : créez votre compte admin, puis dans Table Editor `profiles` passez `role` à `admin` et renseignez `full_name` (ex. `Lucie`).
9. Créez un utilisateur client de test ; créez une ligne `projects` avec `client_id` = son uuid.
10. Dans le dépôt :

```bash
cp .env.example .env
```

Renseignez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (Settings → API).

11. `npm run dev`
   - Client : `/espace-client/connexion` → `/espace-client`
   - Admin : même login → `/admin`
   - CRM : `/admin/prospects` (admin uniquement)
   - Campagnes e-mail : `/admin/prospects/campagnes`
   - Démo prospect publique : `/demo/{public_slug}` (RPC uniquement)
   - Aperçu admin : `/demo/{public_slug}?preview=1` (session admin requise)

## Upload facture Indy (manuel)

1. Via **Administration → fiche projet → Documents**, ou
2. Storage → `project-docs` → dossier `{project_id}/` + ligne `documents`

Les URLs sont signées (bucket privé) — pas d’URL publique permanente.

## RLS CRM (Phase 1 + 2)

Tables `prospect_*` / `prospects` / `prospect_demos` / `prospect_demo_statuses` : **admin only** (`is_admin()`).

Accès public démo **uniquement** via :

- `get_public_prospect_demo(slug)` — colonnes affichables, contrôles SQL (published/shared + dates)
- `record_public_prospect_demo_view(slug)` — incrément atomique `view_count`

`?preview=1` ne donne aucun droit : lecture table via session admin + RLS uniquement.

Test manuel recommandé (compte client connecté) :

- `SELECT` sur `prospects` → 0 ligne / erreur RLS
- idem `prospect_tasks`, `prospect_interactions`, `prospect_demos`, référentiels
- Anon : `SELECT` table `prospect_demos` → interdit ; RPC avec slug publié → OK ; brouillon → vide

Anon : aucun accès table directe.
