/**
 * E-mail transactionnel de confirmation après demande configurateur.
 * Hors prospect_emails / campagnes / limites CRM — best-effort uniquement.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { getEmailProvider, getSmtpFromDefaults, isProviderConfigured } from "./email/factory.ts";

export type CommercialConfirmResult = {
  email_sent: boolean;
  email_error?: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendCommercialRequestConfirmation(opts: {
  service: SupabaseClient;
  to: string;
  contactName: string;
  companyName: string;
  trackingCode: string;
  planId?: string | null;
  tradeSlug?: string | null;
}): Promise<CommercialConfirmResult> {
  if (!isProviderConfigured()) {
    return { email_sent: false, email_error: "Service d'envoi non configuré." };
  }

  const provider = getEmailProvider();
  const smtp = getSmtpFromDefaults();
  const { data: settings } = await opts.service
    .from("crm_email_settings")
    .select("sender_email, sender_name, reply_to")
    .limit(1)
    .maybeSingle();

  const fromEmail = smtp.fromEmail || settings?.sender_email || "";
  const fromName = smtp.fromName || settings?.sender_name || "Site AZ";
  const replyTo = smtp.replyTo || settings?.reply_to || undefined;

  if (!fromEmail) {
    return { email_sent: false, email_error: "Expéditeur non configuré." };
  }

  const greeting = opts.contactName.trim()
    ? `Bonjour ${opts.contactName.trim()},`
    : "Bonjour,";
  const company = opts.companyName.trim() || "votre entreprise";
  const detailParts = [
    opts.tradeSlug ? `métier ${opts.tradeSlug}` : null,
    opts.planId ? `formule ${opts.planId}` : null,
  ].filter(Boolean);
  const detail = detailParts.length ? ` (${detailParts.join(", ")})` : "";

  const subject = `Demande bien reçue — ${opts.trackingCode} · Site AZ`;
  const text = [
    greeting,
    "",
    `Nous avons bien reçu votre demande pour ${company}${detail}.`,
    `Référence de suivi : ${opts.trackingCode}`,
    "",
    "Nous vous recontactons rapidement pour finaliser le devis.",
    "Conservez cette référence si vous nous écrivez.",
    "",
    "— Site AZ",
    "contact@site-az.fr",
  ].join("\n");

  const html = `<p>${escapeHtml(greeting)}</p>
<p>Nous avons bien reçu votre demande pour <strong>${escapeHtml(company)}</strong>${
    detail ? escapeHtml(detail) : ""
  }.</p>
<p>Référence de suivi : <strong>${escapeHtml(opts.trackingCode)}</strong></p>
<p>Nous vous recontactons rapidement pour finaliser le devis.<br/>
Conservez cette référence si vous nous écrivez.</p>
<p>— Site AZ<br/><a href="mailto:contact@site-az.fr">contact@site-az.fr</a></p>`;

  try {
    const result = await provider.sendEmail({
      to: opts.to.trim(),
      subject,
      text,
      html,
      replyTo,
      fromEmail,
      fromName,
    });
    if (!result.ok) {
      return { email_sent: false, email_error: result.error };
    }
    return { email_sent: true };
  } catch (e) {
    return {
      email_sent: false,
      email_error: e instanceof Error ? e.message : "Envoi impossible",
    };
  }
}
