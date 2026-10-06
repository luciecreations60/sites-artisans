# CRM Phase 3 — E-mail & file d’attente

## Principe

- **Individuel** : fiche prospect → brouillon → Edge `send-prospect-email`
- **Campagne** : N `prospect_emails` snapshots → statut `queued` en **base** → worker Edge `process-email-queue` (1 e-mail par appel)

Aucun `setInterval` / `setTimeout` navigateur. Fermer l’Admin **ne perd pas** la file : elle est dans PostgreSQL (`prospect_emails.email_status_id = queued` + campagne `running`).

## Comment la queue fonctionne quand l’Admin est fermé

1. Au **Lancer les envois**, l’UI écrit seulement en base : campagne → `running`, e-mails éligibles → `queued` (+ `queued_at`).
2. Le navigateur n’est plus requis.
3. Un **déclencheur serveur** appelle régulièrement :

```http
POST /functions/v1/process-email-queue
Header: x-crm-cron-secret: <EMAIL_QUEUE_CRON_SECRET>
```

4. Chaque appel traite **au plus 1** e-mail (SMTP individuel), respecte `max_emails_per_hour` / `max_emails_per_day`, recontrôle DNC / campagne `running` / adresse / limites.
5. Si limite atteinte → le worker s’arrête proprement ; les `queued` restent jusqu’à l’heure / jour suivant.
6. Pause campagne → statut `paused` : le worker ignore ces e-mails. Reprendre → `running`.

### Déclencheurs recommandés (choisir un)

| Mécanisme | Notes |
|-----------|--------|
| **Supabase Cron** (Dashboard → Edge Functions → Schedules) | Ex. toutes les 6 minutes → ~10/h max naturel |
| **pg_cron + pg_net** | `net.http_post` vers l’URL de la function avec le secret |
| **GitHub Actions schedule** | Appel HTTPS avec le secret (OK si Actions activées) |
| **Bouton « Traiter 1 (manuel) »** | Uniquement pour test / dépannage admin |

**Ne pas** s’appuyer sur un onglet Admin ouvert.

Sans cron configuré : les e-mails restent `queued` en base (état correct) jusqu’à ce que le worker soit déclenché. Ce n’est pas un faux système fragile — c’est une file persistante en attente de trigger.

## Secrets Edge (jamais `VITE_*`)

```bash
supabase secrets set EMAIL_PROVIDER=ovh_smtp
supabase secrets set SMTP_HOST=ssl0.ovh.net   # selon offre OVH
supabase secrets set SMTP_PORT=465
supabase secrets set SMTP_SECURE=true
supabase secrets set SMTP_USERNAME=contact@mondomaine.fr
supabase secrets set SMTP_PASSWORD=...
supabase secrets set SMTP_FROM_EMAIL=contact@mondomaine.fr
supabase secrets set SMTP_FROM_NAME="Sites Artisans"
supabase secrets set SMTP_REPLY_TO=contact@mondomaine.fr
supabase secrets set EMAIL_QUEUE_CRON_SECRET=une-chaine-longue-aleatoire
supabase secrets set SITE_PUBLIC_URL=https://luciecreations60.github.io/sites-artisans
```

Port **465** obligatoire sur Edge Supabase (25/587 bloqués).

`SITE_PUBLIC_URL` : origine publique de l’app **sans** slash final. Utilisée pour
`redirectTo` des invitations client (`…/espace-client/activation`). Doit être
autorisée dans Supabase Auth → Redirect URLs.

## Deploy functions

```bash
supabase functions deploy send-prospect-email
supabase functions deploy process-email-queue
supabase functions deploy test-email-provider
supabase functions deploy convert-prospect-to-client
supabase functions deploy resend-client-invite
```

## Capacités provider

OVH SMTP : `supportsIndividualSend` + `supportsQueuedSend` = true ; `supportsBulkSend` = false.

## Migration

Exécuter `supabase/migrations/20261006_crm_prospect_emails_phase3.sql` après Phase 2.

Phase 4 : `supabase/migrations/20261007_crm_convert_prospect_phase4.sql`.

## Invitation espace client (Phase 4 — hors prospection)

L’invitation portail réutilise le **transport** EmailProvider (SMTP), mais :

- n’écrit **pas** dans `prospect_emails` ;
- n’apparaît pas dans une campagne ;
- n’incrémente pas les compteurs / limites prospection (`max_emails_per_day` / heure) ;
- ne crée pas de relance commerciale ni d’interaction « contact » CRM ;
- ne modifie pas le last contact ni le statut commercial (la conversion le fait à part).

Si SMTP n’est pas configuré, l’Admin reçoit le lien `invite_link` une seule fois dans la réponse UI (jamais persisté, jamais loggé).

Pendant une conversion (`conversion_lock_*` actif) ou après `converted_at`, `deliver.ts` refuse / annule les e-mails de prospection restants.
