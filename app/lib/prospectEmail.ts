import { trades } from "~/data/trades";
import type { Prospect } from "~/lib/crm.types";
import { publicDemoPath } from "~/lib/prospectDemo";
import type { CrmEmailSettings } from "~/lib/prospectEmail.types";

export type TemplateVars = {
  contact_first_name: string;
  company_name: string;
  trade_label: string;
  city: string;
  website_url: string;
  demo_url: string;
  sender_first_name: string;
  sender_company: string;
  sender_phone: string;
  sender_email: string;
};

const VAR_KEYS = [
  "contact_first_name",
  "company_name",
  "trade_label",
  "city",
  "website_url",
  "demo_url",
  "sender_first_name",
  "sender_company",
  "sender_phone",
  "sender_email",
] as const;

export function isValidEmailAddress(email: string | null | undefined): boolean {
  if (!email) return false;
  const e = email.trim();
  if (!e || e.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export function buildTemplateVars(input: {
  prospect: Prospect;
  settings: Pick<
    CrmEmailSettings,
    "sender_name" | "sender_company" | "sender_email" | "sender_phone"
  >;
  demoPublicSlug?: string | null;
  origin?: string;
}): TemplateVars {
  const { prospect, settings } = input;
  const tradeLabel = prospect.trade_slug
    ? (trades[prospect.trade_slug as keyof typeof trades]?.label ?? prospect.trade_slug)
    : "";
  const first = (prospect.contact_first_name ?? "").trim();
  let demoUrl = "";
  if (input.demoPublicSlug) {
    const path = publicDemoPath(input.demoPublicSlug);
    demoUrl = input.origin ? `${input.origin.replace(/\/$/, "")}${path}` : path;
  }
  const senderFirst =
    settings.sender_name.trim().split(/\s+/)[0] || settings.sender_name.trim();

  return {
    contact_first_name: first,
    company_name: prospect.company_name.trim(),
    trade_label: tradeLabel,
    city: (prospect.city ?? "").trim(),
    website_url: (prospect.website_url ?? "").trim(),
    demo_url: demoUrl,
    sender_first_name: senderFirst,
    sender_company: settings.sender_company.trim(),
    sender_phone: (settings.sender_phone ?? "").trim(),
    sender_email: settings.sender_email.trim(),
  };
}

/** Remplace {{var}} ; jamais "undefined". Salutation adaptée si prénom absent. */
export function renderTemplate(template: string, vars: TemplateVars): string {
  let out = template;
  for (const key of VAR_KEYS) {
    const re = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
    if (key === "contact_first_name") {
      // « Bonjour{{contact_first_name}}, » → « Bonjour Marie, » ou « Bonjour, »
      out = out.replace(re, vars.contact_first_name ? ` ${vars.contact_first_name}` : "");
    } else {
      out = out.replace(re, vars[key] ?? "");
    }
  }
  out = out.replace(/Bonjour\s*,/g, "Bonjour,");
  out = out.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  return out;
}

export function appendFooterAndSignature(
  body: string,
  settings: Pick<CrmEmailSettings, "email_footer">,
): string {
  const footer = (settings.email_footer ?? "").trim();
  if (!footer) return body.trimEnd();
  if (body.includes(footer)) return body.trimEnd();
  return `${body.trimEnd()}\n\n—\n${footer}`;
}

export function textToSimpleHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<div style="font-family:system-ui,sans-serif;white-space:pre-wrap">${escaped}</div>`;
}

export function recipientDisplayName(prospect: Prospect): string {
  const parts = [prospect.contact_first_name, prospect.contact_last_name]
    .map((x) => (x ?? "").trim())
    .filter(Boolean);
  return parts.join(" ") || prospect.company_name;
}

/** Progression statut prospect après premier contact envoyé. */
export function shouldAdvanceToContacte(statusCode: string | undefined): boolean {
  return statusCode === "a_contacter";
}
