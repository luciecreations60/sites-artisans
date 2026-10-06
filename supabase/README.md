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
7. **CRM Phase 4** (conversion Prospect → client / projet / invitation) — après la Phase 3 :
   exécutez `supabase/migrations/20261007_crm_convert_prospect_phase4.sql`
   puis déployez `convert-prospect-to-client` et `resend-client-invite` — voir [EMAIL.md](./EMAIL.md) (section invitation)
8. **Storage** : vérifiez le bucket privé `project-docs`.
9. **Authentication → Users** : créez votre compte admin, puis dans Table Editor `profiles` passez `role` à `admin` et renseignez `full_name` (ex. `Lucie`).
10. **Auth → URL configuration** : ajoutez dans *Redirect URLs* l’URL publique d’activation, par ex.  
    `https://luciecreations60.github.io/sites-artisans/espace-client/activation`  
    et en local `http://localhost:5173/espace-client/activation`.  
    Définissez le secret Edge `SITE_PUBLIC_URL` = origine publique **sans** slash final  
    (ex. `https://luciecreations60.github.io/sites-artisans`).
11. Créez un utilisateur client de test ; créez une ligne `projects` avec `client_id` = son uuid.
12. Dans le dépôt :

```bash
cp .env.example .env
```

Renseignez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (Settings → API).

13. `npm run dev`
   - Client : `/espace-client/connexion` → `/espace-client`
   - Activation invitation : `/espace-client/activation` (lien e-mail / generateLink)
   - Admin : même login → `/admin`
   - CRM : `/admin/prospects` (admin uniquement) — *Transformer en client* sur la fiche
   - Campagnes e-mail : `/admin/prospects/campagnes`
   - Démo prospect publique : `/demo/{public_slug}` (RPC uniquement)
   - Aperçu admin : `/demo/{public_slug}?preview=1` (session admin requise)

### Conversion Prospect → client (Phase 4)

- Edge `convert-prospect-to-client` : claim atomique → Auth/Profile → Project → statut `gagne` → cancel e-mails non envoyés.
- Invitation **uniquement** via `auth.admin.generateLink({ type: "invite" })` puis EmailProvider transactionnel (ou lien ponctuel Admin). Pas de `inviteUserByEmail`. Le lien n’est **jamais** stocké en base.
- Renvoi : Edge `resend-client-invite` (nouveau lien, sans recréer Auth/Profile/Project).
- GitHub Pages : le build copie `index.html` → `404.html` ([scripts/prepare-gh-pages.mjs](../scripts/prepare-gh-pages.mjs)) pour que l’URL directe `/espace-client/activation` charge la SPA.

#### Validation manuelle Phase 4 (A–G)

| | Scénario | Attendu |
|---|----------|---------|
| A | Nouveau client | Auth + Profile + Project + invitation → activation → `/espace-client` |
| B | Client existant (même e-mail) | Nouveau Project, **pas** d’invitation |
| C | Double clic conversion | Un Auth, un Profile, un Project ; 2ᵉ appel « déjà converti » ou « en cours » |
| D | Retry après Auth créé | Reprend sans doublon |
| E | Retry après Project créé | Retrouve le Project, termine `converted_at` |
| F | E-mail `queued` | Dès le claim / `converted_at`, aucun envoi prospection |
| G | Lien invitation en navigation privée | Pas de 404 GH Pages ; MDP → espace client |

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
