import { requireAdminOrCron } from "../_shared/admin.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  checkSendLimits,
  deliverProspectEmail,
  maybeCompleteCampaign,
} from "../_shared/email/deliver.ts";
import { getEmailProvider } from "../_shared/email/factory.ts";

/**
 * Traite AU PLUS un e-mail queued (campagne running).
 * Déclenchement : cron serveur (x-crm-cron-secret) OU admin manuel.
 * Jamais de setInterval navigateur — la file est persistée en base (status queued).
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Méthode non autorisée" }, 405);
  }

  const auth = await requireAdminOrCron(req);
  if ("error" in auth) return jsonResponse({ error: auth.error }, auth.status);

  const provider = getEmailProvider();
  if (
    provider.code === "unconfigured" ||
    !provider.getCapabilities().supportsQueuedSend
  ) {
    return jsonResponse({ error: "Service d'envoi non configuré." }, 503);
  }

  const limits = await checkSendLimits(auth.service);
  if (!limits.ok) {
    return jsonResponse({ ok: true, processed: 0, skipped: limits.error });
  }

  const { data: queuedStatus } = await auth.service
    .from("prospect_email_statuses")
    .select("id")
    .eq("code", "queued")
    .maybeSingle();
  const { data: runningStatus } = await auth.service
    .from("prospect_email_campaign_statuses")
    .select("id")
    .eq("code", "running")
    .maybeSingle();
  if (!queuedStatus || !runningStatus) {
    return jsonResponse({ error: "Référentiels manquants" }, 500);
  }

  // Campagnes en cours
  const { data: runningCamps } = await auth.service
    .from("prospect_email_campaigns")
    .select("id")
    .eq("status_id", runningStatus.id);

  const campIds = (runningCamps ?? []).map((c) => c.id);
  if (!campIds.length) {
    return jsonResponse({ ok: true, processed: 0, message: "Aucune campagne en cours" });
  }

  const { data: next } = await auth.service
    .from("prospect_emails")
    .select("id, campaign_id")
    .eq("email_status_id", queuedStatus.id)
    .in("campaign_id", campIds)
    .order("queued_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!next) {
    for (const id of campIds) {
      await maybeCompleteCampaign(auth.service, id);
    }
    return jsonResponse({ ok: true, processed: 0, message: "File vide" });
  }

  const result = await deliverProspectEmail(auth.service, next.id, "queue");
  await maybeCompleteCampaign(auth.service, next.campaign_id);

  if (!result.ok) {
    // Échec individuel : on signale mais 200 pour permettre la suite du lot
    return jsonResponse({
      ok: true,
      processed: 1,
      email_id: next.id,
      sent: false,
      error: result.error,
    });
  }

  return jsonResponse({
    ok: true,
    processed: 1,
    email_id: next.id,
    sent: true,
  });
});
