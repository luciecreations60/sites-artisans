import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sendCommercialRequestConfirmation } from "../_shared/commercialRequestEmail.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  calculateServerQuote,
  catalogFingerprint,
  type OfferTier,
  type PlanFeatureRow,
  type PlanRow,
  type ProviderRow,
  type PublicFeature,
} from "../_shared/catalogPricing.ts";

type Body = {
  client_request_id?: string;
  client_local_id?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  company_name?: string;
  message?: string;
  contact_preference?: "email" | "phone" | "either";
  trade_slug?: string;
  plan_id?: OfferTier;
  path?: "formula" | "compose";
  specialty?: string;
  city?: string;
  theme_id?: string;
  font_id?: string;
  desired_feature_ids?: string[];
  feature_quantities?: Record<string, number>;
  profile_snapshot?: Record<string, unknown>;
  /** Montant affiché côté client — informatif, jamais utilisé comme référence. */
  client_claimed_creation_cents?: number | null;
};

const TIERS = new Set(["essentiel", "avance", "pro"]);
const RATE_LIMIT = 8;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max);
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function trackingCode(): string {
  const n = crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
  return `AZ-${n}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Méthode non autorisée" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: "Configuration serveur incomplète" }, 500);
  }

  const service = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Corps JSON invalide" }, 400);
  }

  const contactName = truncate(String(body.contact_name ?? "").trim(), 120);
  const contactEmail = normalizeEmail(String(body.contact_email ?? ""));
  const planId = String(body.plan_id ?? "") as OfferTier;
  const tradeSlug = truncate(String(body.trade_slug ?? "").trim(), 64);
  const companyName = truncate(
    String(body.company_name ?? body.profile_snapshot?.company ?? "").trim(),
    160,
  );
  const message = truncate(String(body.message ?? "").trim(), 4000);
  const phone = truncate(String(body.contact_phone ?? "").trim(), 40) || null;
  const city = truncate(String(body.city ?? "").trim(), 80) || null;
  const specialty = truncate(String(body.specialty ?? "").trim(), 160) || null;
  const clientRequestId = truncate(String(body.client_request_id ?? "").trim(), 80) || null;
  const clientLocalId = truncate(String(body.client_local_id ?? "").trim(), 80) || null;
  const desired = Array.isArray(body.desired_feature_ids)
    ? body.desired_feature_ids.filter((x): x is string => typeof x === "string").slice(0, 80)
    : [];
  const quantities =
    body.feature_quantities && typeof body.feature_quantities === "object"
      ? body.feature_quantities
      : {};

  if (!contactName || contactName.length < 2) {
    return jsonResponse({ error: "Nom requis" }, 400);
  }
  if (!isValidEmail(contactEmail)) {
    return jsonResponse({ error: "E-mail invalide" }, 400);
  }
  if (!TIERS.has(planId)) {
    return jsonResponse({ error: "Formule invalide" }, 400);
  }
  if (!tradeSlug) {
    return jsonResponse({ error: "Métier requis" }, 400);
  }

  // Idempotence
  if (clientRequestId) {
    const { data: existing } = await service
      .from("commercial_requests")
      .select("id, tracking_code, prospect_id, configuration_id")
      .eq("client_request_id", clientRequestId)
      .maybeSingle();
    if (existing) {
      return jsonResponse({
        ok: true,
        already_received: true,
        tracking_code: existing.tracking_code,
        request_id: existing.id,
        prospect_id: existing.prospect_id,
        configuration_id: existing.configuration_id,
      });
    }
  }

  // Rate limit atomique (RPC SECURITY DEFINER — pas d’accès table depuis le client)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";
  const bucket = await sha256Hex(`cr:${ip}:${contactEmail}`);
  const { data: allowed, error: rlErr } = await service.rpc("claim_commercial_rate_limit", {
    p_bucket_key: bucket,
    p_limit: RATE_LIMIT,
    p_window_seconds: Math.floor(RATE_WINDOW_MS / 1000),
  });
  if (rlErr) {
    if (rlErr.message.toLowerCase().includes("does not exist")) {
      return jsonResponse(
        {
          error: "Migration commerciale non appliquée (rate limit).",
          code: "migration_pending",
        },
        503,
      );
    }
    return jsonResponse({ error: "Limitation temporaire indisponible" }, 503);
  }
  if (allowed !== true) {
    return jsonResponse({ error: "Trop de demandes. Réessayez plus tard." }, 429);
  }

  // Catalogue vérifié Supabase uniquement
  const [plansRes, featRes, linksRes, provRes, taxRes, sourceRes, statusRes, prioRes] =
    await Promise.all([
      service.from("catalog_plans").select("*").eq("status", "published").eq("is_active", true),
      service.from("catalog_features").select("*").eq("status", "published"),
      service.from("catalog_plan_features").select("*"),
      service.from("catalog_external_providers").select("*"),
      service.from("business_settings").select("*").eq("id", "default").maybeSingle(),
      service.from("prospect_sources").select("id").eq("code", "configurateur_v4").maybeSingle(),
      service.from("prospect_statuses").select("id").eq("code", "a_contacter").maybeSingle(),
      service.from("prospect_priorities").select("id").eq("code", "normale").maybeSingle(),
    ]);

  if (plansRes.error || featRes.error || linksRes.error) {
    const msg =
      plansRes.error?.message ||
      featRes.error?.message ||
      linksRes.error?.message ||
      "Catalogue indisponible";
    if (msg.toLowerCase().includes("does not exist")) {
      return jsonResponse(
        {
          error:
            "Migration catalogue / commerciale non appliquée. Impossible d’enregistrer la demande.",
          code: "migration_pending",
        },
        503,
      );
    }
    return jsonResponse({ error: msg, code: "catalog_error" }, 503);
  }

  if (!plansRes.data?.length) {
    return jsonResponse(
      { error: "Aucune formule publiée — devis contractuel impossible.", code: "catalog_empty" },
      503,
    );
  }

  const plans = plansRes.data as PlanRow[];
  const features = (featRes.data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    setup_price_cents: row.setup_price_cents as number | null,
    recurring_price_cents: row.recurring_price_cents as number | null,
    billing_type: String(row.billing_type),
    commercial_kind: String(row.commercial_kind),
    is_available: Boolean(row.is_available),
    status: String(row.status),
    external_provider_id: (row.external_provider_id as string | null) ?? null,
    depends_on: (row.depends_on as string[] | null) ?? [],
    incompatible_with: (row.incompatible_with as string[] | null) ?? [],
  })) as PublicFeature[];
  const links = (linksRes.data ?? []) as PlanFeatureRow[];
  const providers = (provRes.data ?? []) as ProviderRow[];

  const tax = taxRes.data as {
    tax_regime?: string;
    vat_rate_bps?: number | null;
  } | null;
  const vatRateBps =
    tax?.tax_regime === "liable" && tax.vat_rate_bps != null ? tax.vat_rate_bps : null;

  let pricing;
  try {
    pricing = calculateServerQuote(plans, features, links, providers, {
      planId,
      optionFeatureIds: desired,
      optionQuantities: quantities,
      vatRateBps,
    });
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : "Erreur de calcul" },
      400,
    );
  }

  const fingerprint = catalogFingerprint(plans, features);
  const claimed =
    typeof body.client_claimed_creation_cents === "number"
      ? body.client_claimed_creation_cents
      : null;
  const priceDiffers =
    claimed != null && Number.isInteger(claimed) && claimed !== pricing.creationSubtotalCents;

  // Prospect : match exact e-mail uniquement (pas de fusion floue)
  let prospectId: string | null = null;
  const { data: byEmail } = await service
    .from("prospects")
    .select("id, email, company_name")
    .ilike("email", contactEmail)
    .is("archived_at", null)
    .limit(5);

  if (byEmail && byEmail.length === 1) {
    prospectId = String(byEmail[0].id);
    await service
      .from("prospects")
      .update({
        company_name: companyName || byEmail[0].company_name,
        trade_slug: tradeSlug,
        specialty,
        city,
        phone: phone ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", prospectId);
  } else if (byEmail && byEmail.length > 1) {
    // Correspondance ambiguë : créer une nouvelle fiche + noter pour admin
    prospectId = null;
  }

  if (!prospectId) {
    if (!statusRes.data?.id || !prioRes.data?.id) {
      return jsonResponse(
        { error: "Référentiels CRM manquants (statuts / priorités).", code: "crm_refs" },
        503,
      );
    }
    const nameParts = contactName.split(/\s+/);
    const first = nameParts[0] ?? contactName;
    const last = nameParts.slice(1).join(" ") || null;
    const { data: created, error: createErr } = await service
      .from("prospects")
      .insert({
        company_name: companyName || contactName,
        trade_slug: tradeSlug,
        specialty,
        contact_first_name: first,
        contact_last_name: last,
        email: contactEmail,
        phone,
        city,
        status_id: statusRes.data.id,
        priority_id: prioRes.data.id,
        source_id: sourceRes.data?.id ?? null,
        analysis_notes:
          byEmail && byEmail.length > 1
            ? "Demande Configurateur V4 — plusieurs prospects partagent cet e-mail ; fusion manuelle à vérifier."
            : "Demande Configurateur V4",
        internal_notes: message || null,
      })
      .select("id")
      .single();
    if (createErr || !created) {
      if (createErr?.message?.toLowerCase().includes("does not exist")) {
        return jsonResponse(
          { error: "Tables CRM / commerciales absentes.", code: "migration_pending" },
          503,
        );
      }
      return jsonResponse({ error: createErr?.message ?? "Création prospect impossible" }, 500);
    }
    prospectId = String(created.id);
  }

  // Interaction
  const { data: interType } = await service
    .from("prospect_interaction_types")
    .select("id")
    .eq("code", "quote")
    .maybeSingle();
  if (interType?.id) {
    await service.from("prospect_interactions").insert({
      prospect_id: prospectId,
      interaction_type_id: interType.id,
      title: "Nouvelle demande — Configurateur V4",
      detail: [
        `Formule ${planId}`,
        `Création serveur : ${pricing.creationSubtotalCents} centimes`,
        pricing.pricingComplete ? "Chiffrage complet" : "Chiffrage partiel",
        message ? `Message : ${message}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }

  // Tâche premier contact
  const { data: taskType } = await service
    .from("prospect_task_types")
    .select("id")
    .eq("code", "first_contact")
    .maybeSingle();
  if (taskType?.id) {
    const due = new Date();
    due.setDate(due.getDate() + 1);
    await service.from("prospect_tasks").insert({
      prospect_id: prospectId,
      task_type_id: taskType.id,
      title: "Contacter — demande Configurateur V4",
      detail: `Tracking à confirmer après enregistrement. Formule ${planId}.`,
      due_at: due.toISOString(),
    });
  }

  const { data: configRow, error: configErr } = await service
    .from("site_configurations")
    .insert({
      format_version: 1,
      client_local_id: clientLocalId,
      trade_slug: tradeSlug,
      plan_id: planId,
      path: body.path === "compose" ? "compose" : "formula",
      company_name: companyName || null,
      city,
      specialty,
      theme_id: body.theme_id ?? null,
      font_id: body.font_id ?? null,
      desired_feature_ids: desired,
      feature_quantities: quantities,
      profile_snapshot: body.profile_snapshot ?? {},
      catalog_source: "supabase",
      catalog_fingerprint: fingerprint,
      pricing_snapshot: pricing,
      status: "submitted",
      prospect_id: prospectId,
    })
    .select("id")
    .single();

  if (configErr || !configRow) {
    if (configErr?.message?.toLowerCase().includes("does not exist")) {
      return jsonResponse(
        {
          error:
            "Migration commerciale (20261012) non appliquée. Demande non enregistrée.",
          code: "migration_pending",
        },
        503,
      );
    }
    return jsonResponse({ error: configErr?.message ?? "Configuration non enregistrée" }, 500);
  }

  const code = trackingCode();
  const { data: requestRow, error: reqErr } = await service
    .from("commercial_requests")
    .insert({
      tracking_code: code,
      client_request_id: clientRequestId,
      prospect_id: prospectId,
      configuration_id: configRow.id,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: phone,
      company_name: companyName || null,
      message: message || null,
      contact_preference: body.contact_preference ?? null,
      source_code: "configurateur_v4",
      server_creation_cents: pricing.creationSubtotalCents,
      server_recurring_cents: pricing.recurringSubtotalCents,
      server_pricing_complete: pricing.pricingComplete,
      server_pricing_snapshot: pricing,
      client_claimed_creation_cents: claimed,
      price_differs_from_client: priceDiffers,
      status: "received",
      ip_hash: bucket,
      user_agent: truncate(req.headers.get("user-agent") ?? "", 240),
    })
    .select("id, tracking_code")
    .single();

  if (reqErr || !requestRow) {
    // Course d’idempotence : même client_request_id
    if (clientRequestId && reqErr?.message?.toLowerCase().includes("duplicate")) {
      const { data: existing } = await service
        .from("commercial_requests")
        .select("id, tracking_code, prospect_id, configuration_id")
        .eq("client_request_id", clientRequestId)
        .maybeSingle();
      if (existing) {
        return jsonResponse({
          ok: true,
          already_received: true,
          tracking_code: existing.tracking_code,
          request_id: existing.id,
          prospect_id: existing.prospect_id,
          configuration_id: existing.configuration_id,
        });
      }
    }
    return jsonResponse({ error: reqErr?.message ?? "Demande non enregistrée" }, 500);
  }

  // Quote simulation snapshot
  await service.from("quotes").insert({
    kind: "simulation",
    status: "open",
    prospect_id: prospectId,
    configuration_id: configRow.id,
    commercial_request_id: requestRow.id,
    trade_slug: tradeSlug,
    plan_id: planId,
    creation_ht_cents: pricing.tax.creationHtCents,
    creation_vat_cents: pricing.tax.creationVatCents,
    creation_ttc_cents: pricing.tax.creationTtcCents,
    recurring_cents: pricing.recurringSubtotalCents,
    tax_regime: tax?.tax_regime ?? "unknown",
    vat_rate_bps: vatRateBps,
    pricing_complete: pricing.pricingComplete,
    catalog_fingerprint: fingerprint,
    lines_snapshot: [
      {
        featureId: "__plan__",
        label: `Formule ${pricing.planName}`,
        kind: "plan",
        amountCents: pricing.planSetupCents,
      },
      ...pricing.optionLines,
    ],
    pricing_snapshot: pricing,
    client_snapshot: {
      name: contactName,
      email: contactEmail,
      phone,
      company: companyName,
      city,
    },
    notes: "Simulation commerciale — non contractuelle tant qu’un devis n’est pas validé.",
    locked: false,
  });

  // Confirmation prospect — best-effort (ne fait jamais échouer la demande)
  const emailResult = await sendCommercialRequestConfirmation({
    service,
    to: contactEmail,
    contactName,
    companyName: companyName || "",
    trackingCode: code,
    planId,
    tradeSlug,
  });
  if (!emailResult.email_sent) {
    console.warn(
      "commercial confirmation email skipped/failed",
      emailResult.email_error ?? "unknown",
    );
  }

  return jsonResponse({
    ok: true,
    already_received: false,
    tracking_code: code,
    request_id: requestRow.id,
    prospect_id: prospectId,
    configuration_id: configRow.id,
    server_creation_cents: pricing.creationSubtotalCents,
    server_recurring_cents: pricing.recurringSubtotalCents,
    pricing_complete: pricing.pricingComplete,
    price_differs_from_client: priceDiffers,
    tax: pricing.tax,
    warnings: pricing.warnings,
    email_sent: emailResult.email_sent,
  });
});
