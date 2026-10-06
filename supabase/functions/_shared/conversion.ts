import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { getEmailProvider, getSmtpFromDefaults, isProviderConfigured } from "./email/factory.ts";

const LOCK_TTL_MS = 15 * 60 * 1000;
const TASK_CODES_TO_CLOSE = [
  "first_contact",
  "follow_up",
  "prepare_demo",
  "prepare_quote",
] as const;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const e = email.trim();
  return Boolean(e) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254;
}

export function activationRedirectTo(): string {
  const base = (Deno.env.get("SITE_PUBLIC_URL") ?? "").trim().replace(/\/$/, "");
  if (!base) {
    throw new Error("SITE_PUBLIC_URL non configuré (URL publique de l'application).");
  }
  return `${base}/espace-client/activation`;
}

export function isConversionLockActive(
  lockAt: string | null | undefined,
  now = Date.now(),
): boolean {
  if (!lockAt) return false;
  const t = new Date(lockAt).getTime();
  if (Number.isNaN(t)) return false;
  return now - t < LOCK_TTL_MS;
}

export async function releaseLock(
  service: SupabaseClient,
  prospectId: string,
  token: string,
): Promise<void> {
  await service.rpc("release_prospect_conversion_lock", {
    p_prospect_id: prospectId,
    p_token: token,
  });
}

export async function cancelNonSentProspectEmails(
  service: SupabaseClient,
  prospectId: string,
  reason: string,
): Promise<void> {
  const { data: statuses } = await service
    .from("prospect_email_statuses")
    .select("id, code");
  const byCode = new Map((statuses ?? []).map((s) => [s.code, s.id]));
  const cancelledId = byCode.get("cancelled");
  const sentId = byCode.get("sent");
  if (!cancelledId) return;

  let q = service
    .from("prospect_emails")
    .update({
      email_status_id: cancelledId,
      failure_reason: reason,
      failed_at: new Date().toISOString(),
    })
    .eq("prospect_id", prospectId);

  if (sentId) {
    q = q.neq("email_status_id", sentId);
  }
  q = q.neq("email_status_id", cancelledId);
  await q;
}

export async function closeCommercialTasks(
  service: SupabaseClient,
  prospectId: string,
): Promise<void> {
  const { data: types } = await service
    .from("prospect_task_types")
    .select("id, code")
    .in("code", [...TASK_CODES_TO_CLOSE]);
  const typeIds = (types ?? []).map((t) => t.id);
  if (typeIds.length === 0) return;

  await service
    .from("prospect_tasks")
    .update({ completed_at: new Date().toISOString() })
    .eq("prospect_id", prospectId)
    .in("task_type_id", typeIds)
    .is("completed_at", null);
}

export async function ensureConversionInteraction(
  service: SupabaseClient,
  prospectId: string,
  userId: string,
  detail: string,
): Promise<void> {
  const { data: ixType } = await service
    .from("prospect_interaction_types")
    .select("id")
    .eq("code", "conversion")
    .maybeSingle();
  if (!ixType) return;

  const { data: existing } = await service
    .from("prospect_interactions")
    .select("id")
    .eq("prospect_id", prospectId)
    .eq("interaction_type_id", ixType.id)
    .limit(1)
    .maybeSingle();
  if (existing) return;

  await service.from("prospect_interactions").insert({
    prospect_id: prospectId,
    interaction_type_id: ixType.id,
    title: "Conversion en client",
    detail,
    created_by: userId,
  });
}

export async function ensureProjectCreatedEvent(
  service: SupabaseClient,
  projectId: string,
  userId: string,
  detail: string | null,
): Promise<void> {
  const { data: existing } = await service
    .from("project_events")
    .select("id")
    .eq("project_id", projectId)
    .eq("label", "Projet créé")
    .limit(1)
    .maybeSingle();
  if (existing) return;

  await service.from("project_events").insert({
    project_id: projectId,
    label: "Projet créé",
    detail,
    created_by: userId,
    visible_to_client: true,
  });
}

export type InviteSendResult = {
  invitation_sent: boolean;
  invite_link?: string;
  invitation_error?: string;
};

/**
 * Envoie le lien d'invitation via EmailProvider transactionnel (hors prospect_emails).
 * Ne loggue jamais le lien. Ne stocke jamais le lien.
 */
export async function sendOrReturnInviteLink(opts: {
  service: SupabaseClient;
  to: string;
  inviteLink: string;
  companyName: string;
  contactName: string | null;
  sendInvitation: boolean;
}): Promise<InviteSendResult> {
  const { to, inviteLink, companyName, contactName, sendInvitation } = opts;

  if (!sendInvitation || !isProviderConfigured()) {
    return { invitation_sent: false, invite_link: inviteLink };
  }

  const provider = getEmailProvider();
  const smtp = getSmtpFromDefaults();
  const { data: settings } = await opts.service
    .from("crm_email_settings")
    .select("sender_email, sender_name, reply_to")
    .limit(1)
    .maybeSingle();

  const fromEmail = smtp.fromEmail || settings?.sender_email || "";
  const fromName = smtp.fromName || settings?.sender_name || "Sites Artisans";
  const replyTo = smtp.replyTo || settings?.reply_to || undefined;

  if (!fromEmail) {
    return {
      invitation_sent: false,
      invite_link: inviteLink,
      invitation_error: "Expéditeur non configuré — lien fourni pour envoi manuel.",
    };
  }

  const greeting = contactName ? `Bonjour ${contactName},` : "Bonjour,";
  const subject = "Activez votre espace client Sites Artisans";
  const text = [
    greeting,
    "",
    `Votre espace client pour ${companyName} est prêt.`,
    "Cliquez sur le lien suivant pour définir votre mot de passe et accéder à votre projet :",
    "",
    inviteLink,
    "",
    "Ce lien est personnel et à usage unique. Ne le partagez pas.",
    "",
    "— Sites Artisans",
  ].join("\n");

  const html = `<p>${greeting}</p>
<p>Votre espace client pour <strong>${escapeHtml(companyName)}</strong> est prêt.</p>
<p><a href="${escapeAttr(inviteLink)}">Activer mon espace client</a></p>
<p>Ce lien est personnel et à usage unique. Ne le partagez pas.</p>
<p>— Sites Artisans</p>`;

  const result = await provider.sendEmail({
    to: to.trim(),
    subject,
    text,
    html,
    replyTo,
    fromEmail,
    fromName,
  });

  if (!result.ok) {
    return {
      invitation_sent: false,
      invite_link: inviteLink,
      invitation_error: result.error,
    };
  }

  return { invitation_sent: true };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

export async function generateInviteLink(
  service: SupabaseClient,
  email: string,
  meta?: { full_name?: string; company_name?: string },
): Promise<{ userId: string; actionLink: string }> {
  const redirectTo = activationRedirectTo();
  const { data, error } = await service.auth.admin.generateLink({
    type: "invite",
    email: email.trim(),
    options: {
      redirectTo,
      data: {
        full_name: meta?.full_name ?? undefined,
        company_name: meta?.company_name ?? undefined,
      },
    },
  });

  if (error || !data?.user?.id) {
    throw new Error(error?.message ?? "Impossible de générer le lien d'invitation.");
  }

  const actionLink =
    (data as { properties?: { action_link?: string } }).properties?.action_link ??
    (data as { action_link?: string }).action_link;

  if (!actionLink) {
    throw new Error("generateLink n'a pas retourné de lien d'invitation.");
  }

  return { userId: data.user.id, actionLink };
}
