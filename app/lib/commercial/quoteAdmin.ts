import { getSupabase } from "~/lib/supabase";
import type { QuoteRow } from "./types";

/** Passe une simulation en brouillon de devis (admin). */
export async function promoteQuoteToDraft(
  quoteId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Supabase non configuré" };
  const { data, error } = await sb
    .from("quotes")
    .select("id, kind, locked")
    .eq("id", quoteId)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Devis introuvable" };
  if (data.locked) return { ok: false, error: "Devis verrouillé" };
  if (data.kind === "issued") return { ok: false, error: "Devis déjà émis" };

  const { error: up } = await sb
    .from("quotes")
    .update({ kind: "draft", updated_at: new Date().toISOString() })
    .eq("id", quoteId);
  if (up) return { ok: false, error: up.message };
  return { ok: true };
}

/**
 * Émet un devis contractuel (verrouille le snapshot).
 * Refuse si les données légales émetteur sont insuffisantes ou si le chiffrage est incomplet.
 */
export async function issueQuote(
  quoteId: string,
): Promise<{ ok: true; reference: string } | { ok: false; error: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Supabase non configuré" };

  const [{ data: quote, error: qErr }, { data: settings, error: sErr }] = await Promise.all([
    sb.from("quotes").select("*").eq("id", quoteId).maybeSingle(),
    sb.from("business_settings").select("*").eq("id", "default").maybeSingle(),
  ]);

  if (qErr) return { ok: false, error: qErr.message };
  if (sErr) return { ok: false, error: sErr.message };
  if (!quote) return { ok: false, error: "Devis introuvable" };
  if (quote.locked || quote.kind === "issued") {
    return { ok: false, error: "Devis déjà émis ou verrouillé" };
  }
  if (!quote.pricing_complete) {
    return {
      ok: false,
      error: "Chiffrage incomplet — impossible d’émettre un devis contractuel.",
    };
  }
  if (!settings?.legal_name || !settings?.address_line || !settings?.city) {
    return {
      ok: false,
      error:
        "Coordonnées légales émetteur incomplètes (raison sociale, adresse, ville). Complétez business_settings.",
    };
  }
  if (settings.tax_regime === "unknown") {
    return {
      ok: false,
      error: "Régime de TVA non configuré (franchise / assujetti). Arbitrage requis.",
    };
  }
  if (settings.tax_regime === "liable" && (settings.vat_rate_bps == null || !settings.vat_number)) {
    return {
      ok: false,
      error: "Assujettissement TVA : indiquez le taux (bps) et le n° de TVA.",
    };
  }

  const ref = `D-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${quoteId.slice(0, 6).toUpperCase()}`;
  const validDays = settings.quote_validity_days ?? 30;
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + validDays);

  const { error: up } = await sb
    .from("quotes")
    .update({
      kind: "issued",
      status: "sent",
      reference: ref,
      locked: true,
      issued_at: new Date().toISOString(),
      valid_until: validUntil.toISOString().slice(0, 10),
      issuer_snapshot: {
        legal_name: settings.legal_name,
        trade_name: settings.trade_name,
        address_line: settings.address_line,
        postal_code: settings.postal_code,
        city: settings.city,
        email: settings.email,
        phone: settings.phone,
        siret: settings.siret,
        vat_number: settings.vat_number,
        tax_regime: settings.tax_regime,
        vat_rate_bps: settings.vat_rate_bps,
        payment_terms: settings.payment_terms,
      },
      notes:
        "Devis contractuel — snapshot figé. Une modification ultérieure du catalogue ne change pas ce document.",
    })
    .eq("id", quoteId);

  if (up) return { ok: false, error: up.message };
  return { ok: true, reference: ref };
}

export async function loadProspectCommercial(
  prospectId: string,
): Promise<{
  requests: import("./types").CommercialRequestRow[];
  configurations: import("./types").SiteConfigurationRow[];
  quotes: QuoteRow[];
  error?: string;
}> {
  const sb = getSupabase();
  if (!sb) {
    return { requests: [], configurations: [], quotes: [], error: "Supabase non configuré" };
  }
  const [r, c, q] = await Promise.all([
    sb
      .from("commercial_requests")
      .select("*")
      .eq("prospect_id", prospectId)
      .order("created_at", { ascending: false }),
    sb
      .from("site_configurations")
      .select("*")
      .eq("prospect_id", prospectId)
      .order("created_at", { ascending: false }),
    sb
      .from("quotes")
      .select("*")
      .eq("prospect_id", prospectId)
      .order("created_at", { ascending: false }),
  ]);

  const missing =
    [r.error, c.error, q.error].find((e) => e?.message.toLowerCase().includes("does not exist"))
      ?.message;

  return {
    requests: (r.data as import("./types").CommercialRequestRow[]) ?? [],
    configurations: (c.data as import("./types").SiteConfigurationRow[]) ?? [],
    quotes: (q.data as QuoteRow[]) ?? [],
    error: missing
      ? "Migration commerciale non appliquée (tables absentes)."
      : r.error?.message || c.error?.message || q.error?.message,
  };
}
