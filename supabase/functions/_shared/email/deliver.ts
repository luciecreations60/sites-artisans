import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { getEmailProvider, getSmtpFromDefaults } from "./factory.ts";

function isValidEmail(email: string): boolean {
  const e = email.trim();
  return Boolean(e) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254;
}

function sanitizeFailure(msg: string): string {
  return msg
    .replace(/pass(word)?[=:]\S+/gi, "password=***")
    .slice(0, 500);
}

async function statusId(service: SupabaseClient, code: string): Promise<string | null> {
  const { data } = await service
    .from("prospect_email_statuses")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  return data?.id ?? null;
}

async function countSentSince(
  service: SupabaseClient,
  sinceIso: string,
): Promise<number> {
  const { data: sentStatus } = await service
    .from("prospect_email_statuses")
    .select("id")
    .eq("code", "sent")
    .maybeSingle();
  if (!sentStatus) return 0;
  const { count } = await service
    .from("prospect_emails")
    .select("id", { count: "exact", head: true })
    .eq("email_status_id", sentStatus.id)
    .gte("sent_at", sinceIso);
  return count ?? 0;
}

export async function checkSendLimits(
  service: SupabaseClient,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: settings } = await service.from("crm_email_settings").select("*").limit(1).maybeSingle();
  if (!settings) return { ok: false, error: "Configuration e-mail absente." };

  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);

  const perHour = await countSentSince(service, hourAgo);
  if (perHour >= settings.max_emails_per_hour) {
    return { ok: false, error: "Limite d'envoi configurée atteinte." };
  }
  const perDay = await countSentSince(service, dayStart.toISOString());
  if (perDay >= settings.max_emails_per_day) {
    return { ok: false, error: "Limite d'envoi configurée atteinte." };
  }
  return { ok: true };
}

type DeliverMode = "direct" | "queue";

/**
 * Envoie un prospect_email après contrôles serveur.
 * mode direct: draft|ready|failed → sending → sent|failed
 * mode queue: queued → sending → sent|failed
 */
export async function deliverProspectEmail(
  service: SupabaseClient,
  emailId: string,
  mode: DeliverMode,
): Promise<{ ok: true; suggestFollowUp?: boolean } | { ok: false; error: string; status?: number }> {
  const provider = getEmailProvider();
  if (provider.code === "unconfigured" || !provider.getCapabilities().supportsIndividualSend) {
    return { ok: false, error: "Service d'envoi non configuré.", status: 503 };
  }

  const limits = await checkSendLimits(service);
  if (!limits.ok) return { ok: false, error: limits.error, status: 429 };

  const { data: email, error: emailErr } = await service
    .from("prospect_emails")
    .select("*")
    .eq("id", emailId)
    .maybeSingle();
  if (emailErr || !email) return { ok: false, error: "E-mail introuvable.", status: 404 };

  const { data: statusRow } = await service
    .from("prospect_email_statuses")
    .select("code")
    .eq("id", email.email_status_id)
    .maybeSingle();
  const statusCode = statusRow?.code ?? "";

  const allowed =
    mode === "queue"
      ? ["queued"]
      : ["draft", "ready", "failed"];
  if (!allowed.includes(statusCode)) {
    if (statusCode === "sending" || statusCode === "sent") {
      return { ok: false, error: "E-mail déjà en cours d'envoi ou envoyé.", status: 409 };
    }
    return { ok: false, error: `Statut incompatible: ${statusCode || "?"}`, status: 409 };
  }

  const { data: prospect } = await service
    .from("prospects")
    .select("*")
    .eq("id", email.prospect_id)
    .maybeSingle();
  if (!prospect) return { ok: false, error: "Prospect introuvable.", status: 404 };

  // Campagne : doit être running (pas paused / cancelled)
  if (mode === "queue" && email.campaign_id) {
    const { data: camp } = await service
      .from("prospect_email_campaigns")
      .select("id, status_id, prospect_email_campaign_statuses(code)")
      .eq("id", email.campaign_id)
      .maybeSingle();
    const campCode = (camp as { prospect_email_campaign_statuses?: { code: string } } | null)
      ?.prospect_email_campaign_statuses?.code;
    if (campCode !== "running") {
      return {
        ok: false,
        error: campCode === "paused"
          ? "Campagne en pause."
          : "Campagne non active.",
        status: 409,
      };
    }
  }

  if (prospect.do_not_contact) {
    const cancelled = await statusId(service, "cancelled");
    if (cancelled) {
      await service
        .from("prospect_emails")
        .update({
          email_status_id: cancelled,
          failure_reason: "Ne plus contacter",
          failed_at: new Date().toISOString(),
        })
        .eq("id", emailId);
    }
    return { ok: false, error: "Prospect en « Ne plus contacter ».", status: 403 };
  }

  if (prospect.archived_at) {
    const cancelled = await statusId(service, "cancelled");
    if (cancelled) {
      await service
        .from("prospect_emails")
        .update({
          email_status_id: cancelled,
          failure_reason: "Prospect archivé",
          failed_at: new Date().toISOString(),
        })
        .eq("id", emailId);
    }
    return { ok: false, error: "Prospect archivé.", status: 403 };
  }

  if (!isValidEmail(email.recipient_email)) {
    return { ok: false, error: "Adresse destinataire invalide.", status: 400 };
  }

  const sendingId = await statusId(service, "sending");
  const sentId = await statusId(service, "sent");
  const failedId = await statusId(service, "failed");
  if (!sendingId || !sentId || !failedId) {
    return { ok: false, error: "Statuts e-mail manquants.", status: 500 };
  }

  // Transition atomique
  const { data: claimed, error: claimErr } = await service
    .from("prospect_emails")
    .update({
      email_status_id: sendingId,
      sending_at: new Date().toISOString(),
      failure_reason: null,
    })
    .eq("id", emailId)
    .eq("email_status_id", email.email_status_id)
    .select("id")
    .maybeSingle();

  if (claimErr || !claimed) {
    return { ok: false, error: "E-mail déjà en cours d'envoi ou envoyé.", status: 409 };
  }

  const { data: settings } = await service.from("crm_email_settings").select("*").limit(1).maybeSingle();
  const smtpDefaults = getSmtpFromDefaults();
  const fromEmail = smtpDefaults.fromEmail || settings?.sender_email || "";
  const fromName = smtpDefaults.fromName || settings?.sender_name || "Sites Artisans";
  const replyTo = smtpDefaults.replyTo || settings?.reply_to || undefined;

  if (!fromEmail) {
    await service
      .from("prospect_emails")
      .update({
        email_status_id: failedId,
        failed_at: new Date().toISOString(),
        failure_reason: "Expéditeur non configuré",
      })
      .eq("id", emailId);
    return { ok: false, error: "Service d'envoi non configuré.", status: 503 };
  }

  const result = await provider.sendEmail({
    to: email.recipient_email.trim(),
    subject: email.subject,
    text: email.body_text,
    html: email.body_html || undefined,
    replyTo,
    fromEmail,
    fromName,
  });

  if (!result.ok) {
    await service
      .from("prospect_emails")
      .update({
        email_status_id: failedId,
        failed_at: new Date().toISOString(),
        failure_reason: sanitizeFailure(result.error),
        provider_code: result.providerCode,
      })
      .eq("id", emailId);
    return { ok: false, error: result.error, status: 502 };
  }

  await service
    .from("prospect_emails")
    .update({
      email_status_id: sentId,
      sent_at: new Date().toISOString(),
      provider_code: result.providerCode,
      provider_message_id: result.messageId ?? null,
      failure_reason: null,
    })
    .eq("id", emailId);

  // Interaction
  const { data: emailType } = await service
    .from("prospect_email_types")
    .select("label")
    .eq("id", email.email_type_id)
    .maybeSingle();
  const { data: ixType } = await service
    .from("prospect_interaction_types")
    .select("id")
    .eq("code", "email")
    .maybeSingle();
  if (ixType) {
    await service.from("prospect_interactions").insert({
      prospect_id: email.prospect_id,
      interaction_type_id: ixType.id,
      title: `${emailType?.label ?? "E-mail"} envoyé`,
      detail: email.subject,
    });
  }

  // Statut prospect a_contacter → contacte
  const { data: pStatus } = await service
    .from("prospect_statuses")
    .select("code")
    .eq("id", prospect.status_id)
    .maybeSingle();
  if (pStatus?.code === "a_contacter") {
    const { data: contacte } = await service
      .from("prospect_statuses")
      .select("id")
      .eq("code", "contacte")
      .maybeSingle();
    if (contacte) {
      await service.from("prospects").update({ status_id: contacte.id }).eq("id", prospect.id);
    }
  }

  // Démo → shared si publiable
  if (email.demo_id) {
    const { data: demo } = await service
      .from("prospect_demos")
      .select("*, prospect_demo_statuses(code)")
      .eq("id", email.demo_id)
      .maybeSingle();
    const demoStatus = (demo as { prospect_demo_statuses?: { code: string } } | null)
      ?.prospect_demo_statuses?.code;
    if (demo && (demoStatus === "published" || demoStatus === "shared")) {
      const { data: shared } = await service
        .from("prospect_demo_statuses")
        .select("id")
        .eq("code", "shared")
        .maybeSingle();
      if (shared && demoStatus !== "shared") {
        await service
          .from("prospect_demos")
          .update({
            status_id: shared.id,
            shared_at: new Date().toISOString(),
            published_at: demo.published_at ?? new Date().toISOString(),
            disabled_at: null,
          })
          .eq("id", email.demo_id);
      }
    }
  }

  return { ok: true, suggestFollowUp: !email.campaign_id };
}

export async function maybeCompleteCampaign(
  service: SupabaseClient,
  campaignId: string | null,
): Promise<void> {
  if (!campaignId) return;
  const { data: queued } = await service
    .from("prospect_email_statuses")
    .select("id")
    .eq("code", "queued")
    .maybeSingle();
  const { data: sending } = await service
    .from("prospect_email_statuses")
    .select("id")
    .eq("code", "sending")
    .maybeSingle();
  if (!queued) return;

  let q = service
    .from("prospect_emails")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .eq("email_status_id", queued.id);
  const { count: queuedCount } = await q;
  let sendingCount = 0;
  if (sending) {
    const r = await service
      .from("prospect_emails")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .eq("email_status_id", sending.id);
    sendingCount = r.count ?? 0;
  }
  if ((queuedCount ?? 0) > 0 || sendingCount > 0) return;

  const { data: completed } = await service
    .from("prospect_email_campaign_statuses")
    .select("id")
    .eq("code", "completed")
    .maybeSingle();
  const { data: camp } = await service
    .from("prospect_email_campaigns")
    .select("status_id, prospect_email_campaign_statuses(code)")
    .eq("id", campaignId)
    .maybeSingle();
  const code = (camp as { prospect_email_campaign_statuses?: { code: string } } | null)
    ?.prospect_email_campaign_statuses?.code;
  if (completed && (code === "running" || code === "paused")) {
    await service
      .from("prospect_email_campaigns")
      .update({
        status_id: completed.id,
        completed_at: new Date().toISOString(),
      })
      .eq("id", campaignId);
  }
}
