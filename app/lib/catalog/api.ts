import {
  getStaticAdminCatalog,
  getStaticPublicCatalog,
  toPublicFeature,
  STATIC_FEATURES,
} from "~/data/catalog/staticCatalog";
import type {
  AdminCatalog,
  CatalogFeature,
  CatalogFeatureInternal,
  CatalogFeaturePublic,
  CatalogPlan,
  CatalogPlanFeature,
  CatalogTradeFeature,
  CatalogExternalProvider,
  PublicCatalog,
} from "~/data/catalog/types";
import { getSupabase, isSupabaseConfigured } from "~/lib/supabase";

const TABLE_PLANS = "catalog_plans";

export type CatalogLoadState =
  | { status: "ready"; catalog: PublicCatalog }
  | { status: "migration_pending"; catalog: PublicCatalog }
  | { status: "error"; message: string; catalog: PublicCatalog };

function isMissingRelationError(message: string | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes("does not exist") ||
    m.includes("n’existe pas") ||
    m.includes("schema cache") ||
    m.includes("could not find the table")
  );
}

function mapPlan(row: Record<string, unknown>): CatalogPlan {
  return {
    id: row.id as CatalogPlan["id"],
    name: String(row.name),
    description: String(row.description ?? ""),
    setupPriceCents: Number(row.setup_price_cents),
    currency: "EUR",
    sortOrder: Number(row.sort_order ?? 0),
    isActive: Boolean(row.is_active),
    status: row.status === "published" ? "published" : "draft",
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

function mapFeaturePublic(row: Record<string, unknown>): CatalogFeaturePublic {
  return {
    id: String(row.id),
    category: row.category as CatalogFeaturePublic["category"],
    name: String(row.name),
    description: String(row.description ?? ""),
    setupPriceCents: row.setup_price_cents == null ? null : Number(row.setup_price_cents),
    recurringPriceCents:
      row.recurring_price_cents == null ? null : Number(row.recurring_price_cents),
    billingType: row.billing_type as CatalogFeaturePublic["billingType"],
    commercialKind: row.commercial_kind as CatalogFeaturePublic["commercialKind"],
    isAvailable: Boolean(row.is_available),
    status: row.status === "published" ? "published" : "draft",
    personalizationLevel: row.personalization_level as CatalogFeaturePublic["personalizationLevel"],
    devStatus: row.dev_status as CatalogFeaturePublic["devStatus"],
    sortOrder: Number(row.sort_order ?? 0),
    externalProviderId: (row.external_provider_id as string | null) ?? null,
    dependsOn: (row.depends_on as string[] | null) ?? [],
    incompatibleWith: (row.incompatible_with as string[] | null) ?? [],
  };
}

/**
 * Charge le catalogue public.
 * Si Supabase n’est pas configuré ou si la migration n’est pas appliquée → secours statique.
 */
export async function loadPublicCatalog(): Promise<CatalogLoadState> {
  const fallback = getStaticPublicCatalog();
  if (!isSupabaseConfigured()) {
    return { status: "migration_pending", catalog: fallback };
  }

  const sb = getSupabase();
  if (!sb) {
    return { status: "migration_pending", catalog: fallback };
  }

  const plansRes = await sb
    .from(TABLE_PLANS)
    .select("*")
    .eq("status", "published")
    .eq("is_active", true)
    .order("sort_order");

  if (plansRes.error) {
    if (isMissingRelationError(plansRes.error.message)) {
      return { status: "migration_pending", catalog: fallback };
    }
    return {
      status: "error",
      message: plansRes.error.message,
      catalog: fallback,
    };
  }

  const [featuresRes, planFeatRes, tradeRes, providersRes] = await Promise.all([
    sb.from("catalog_features_public").select("*").eq("status", "published").order("sort_order"),
    sb.from("catalog_plan_features").select("*"),
    sb.from("catalog_trade_features").select("*").order("sort_order"),
    sb.from("catalog_external_providers").select("*"),
  ]);

  if (
    featuresRes.error ||
    planFeatRes.error ||
    tradeRes.error ||
    providersRes.error
  ) {
    const msg =
      featuresRes.error?.message ||
      planFeatRes.error?.message ||
      tradeRes.error?.message ||
      providersRes.error?.message ||
      "Erreur catalogue";
    if (isMissingRelationError(msg)) {
      return { status: "migration_pending", catalog: fallback };
    }
    return { status: "error", message: msg, catalog: fallback };
  }

  const catalog: PublicCatalog = {
    source: "supabase",
    migrationPending: false,
    plans: (plansRes.data as Record<string, unknown>[]).map(mapPlan),
    features: (featuresRes.data as Record<string, unknown>[]).map(mapFeaturePublic),
    planFeatures: (planFeatRes.data as Record<string, unknown>[]).map((row) => ({
      planId: row.plan_id as CatalogPlanFeature["planId"],
      featureId: String(row.feature_id),
      inclusion: row.inclusion as CatalogPlanFeature["inclusion"],
      variantLabel: (row.variant_label as string | null) ?? null,
    })),
    tradeFeatures: (tradeRes.data as Record<string, unknown>[]).map((row) => ({
      tradeSlug: row.trade_slug as CatalogTradeFeature["tradeSlug"],
      featureId: String(row.feature_id),
      sortOrder: Number(row.sort_order ?? 0),
      note: (row.note as string | null) ?? null,
    })),
    externalProviders: (providersRes.data as Record<string, unknown>[]).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      integrationLevel: row.integration_level as CatalogExternalProvider["integrationLevel"],
      notes: String(row.notes ?? ""),
      vendorCostNote: (row.vendor_cost_note as string | null) ?? null,
    })),
  };

  return { status: "ready", catalog };
}

/**
 * Charge le catalogue admin (inclut brouillons + champs internes).
 * Ne prétend jamais avoir sauvegardé si les tables manquent.
 */
export async function loadAdminCatalog(): Promise<{
  state: "ready" | "migration_pending" | "error";
  message?: string;
  catalog: AdminCatalog;
}> {
  const fallback = getStaticAdminCatalog();
  if (!isSupabaseConfigured()) {
    return {
      state: "migration_pending",
      message: "Supabase non configuré",
      catalog: fallback,
    };
  }

  const sb = getSupabase();
  if (!sb) {
    return { state: "migration_pending", catalog: fallback };
  }

  const plansRes = await sb.from(TABLE_PLANS).select("*").order("sort_order");
  if (plansRes.error) {
    if (isMissingRelationError(plansRes.error.message)) {
      return {
        state: "migration_pending",
        message: "Catalogue à initialiser dans Supabase",
        catalog: fallback,
      };
    }
    return { state: "error", message: plansRes.error.message, catalog: fallback };
  }

  const [featuresRes, internalsRes, planFeatRes, tradeRes, providersRes] = await Promise.all([
    sb.from("catalog_features").select("*").order("sort_order"),
    sb.from("catalog_feature_internals").select("*"),
    sb.from("catalog_plan_features").select("*"),
    sb.from("catalog_trade_features").select("*").order("sort_order"),
    sb.from("catalog_external_providers").select("*"),
  ]);

  if (featuresRes.error || internalsRes.error) {
    const msg = featuresRes.error?.message || internalsRes.error?.message || "";
    if (isMissingRelationError(msg)) {
      return {
        state: "migration_pending",
        message: "Catalogue à initialiser dans Supabase",
        catalog: fallback,
      };
    }
    return { state: "error", message: msg, catalog: fallback };
  }

  const internals = new Map(
    ((internalsRes.data as Record<string, unknown>[]) ?? []).map((row) => [
      String(row.feature_id),
      {
        featureId: String(row.feature_id),
        configMinutes: row.config_minutes == null ? null : Number(row.config_minutes),
        complexity: (row.complexity as CatalogFeatureInternal["complexity"]) ?? null,
        profitabilityNote: (row.profitability_note as string | null) ?? null,
      } satisfies CatalogFeatureInternal,
    ]),
  );

  const featuresAdmin: CatalogFeature[] = (
    (featuresRes.data as Record<string, unknown>[]) ?? []
  ).map((row) => {
    const pub = mapFeaturePublic(row);
    return { ...pub, internal: internals.get(pub.id) };
  });

  return {
    state: "ready",
    catalog: {
      source: "supabase",
      migrationPending: false,
      plans: (plansRes.data as Record<string, unknown>[]).map(mapPlan),
      features: featuresAdmin.filter((f) => f.status === "published").map(toPublicFeature),
      featuresAdmin,
      planFeatures: ((planFeatRes.data as Record<string, unknown>[]) ?? []).map((row) => ({
        planId: row.plan_id as CatalogPlanFeature["planId"],
        featureId: String(row.feature_id),
        inclusion: row.inclusion as CatalogPlanFeature["inclusion"],
        variantLabel: (row.variant_label as string | null) ?? null,
      })),
      tradeFeatures: ((tradeRes.data as Record<string, unknown>[]) ?? []).map((row) => ({
        tradeSlug: row.trade_slug as CatalogTradeFeature["tradeSlug"],
        featureId: String(row.feature_id),
        sortOrder: Number(row.sort_order ?? 0),
        note: (row.note as string | null) ?? null,
      })),
      externalProviders: ((providersRes.data as Record<string, unknown>[]) ?? []).map((row) => ({
        id: String(row.id),
        name: String(row.name),
        integrationLevel: row.integration_level as CatalogExternalProvider["integrationLevel"],
        notes: String(row.notes ?? ""),
        vendorCostNote: (row.vendor_cost_note as string | null) ?? null,
      })),
    },
  };
}

export async function updatePlanSetupPrice(
  planId: string,
  setupPriceCents: number,
): Promise<{ ok: true } | { ok: false; reason: "migration_pending" | "error"; message: string }> {
  if (!Number.isInteger(setupPriceCents) || setupPriceCents < 0) {
    return { ok: false, reason: "error", message: "Prix invalide (centimes entiers ≥ 0)" };
  }
  const sb = getSupabase();
  if (!sb) {
    return {
      ok: false,
      reason: "migration_pending",
      message: "Catalogue à initialiser dans Supabase",
    };
  }
  const { error } = await sb
    .from(TABLE_PLANS)
    .update({
      setup_price_cents: setupPriceCents,
      updated_at: new Date().toISOString(),
    })
    .eq("id", planId);

  if (error) {
    if (isMissingRelationError(error.message)) {
      return {
        ok: false,
        reason: "migration_pending",
        message: "Catalogue à initialiser dans Supabase",
      };
    }
    return { ok: false, reason: "error", message: error.message };
  }
  return { ok: true };
}

export async function updateFeatureAdmin(payload: {
  id: string;
  name: string;
  description: string;
  setupPriceCents: number | null;
  recurringPriceCents: number | null;
  isAvailable: boolean;
  status: "draft" | "published";
  commercialKind: CatalogFeaturePublic["commercialKind"];
  configMinutes: number | null;
}): Promise<{ ok: true } | { ok: false; reason: "migration_pending" | "error"; message: string }> {
  const sb = getSupabase();
  if (!sb) {
    return {
      ok: false,
      reason: "migration_pending",
      message: "Catalogue à initialiser dans Supabase",
    };
  }

  // Empêche de publier une option payante sans prix ou non développée
  if (payload.status === "published" && payload.commercialKind === "optional_priced") {
    if (payload.setupPriceCents == null && payload.recurringPriceCents == null) {
      return {
        ok: false,
        reason: "error",
        message: "Impossible de publier une option payante sans tarif",
      };
    }
  }

  const { error } = await sb
    .from("catalog_features")
    .update({
      name: payload.name,
      description: payload.description,
      setup_price_cents: payload.setupPriceCents,
      recurring_price_cents: payload.recurringPriceCents,
      is_available: payload.isAvailable,
      status: payload.status,
      commercial_kind: payload.commercialKind,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id);

  if (error) {
    if (isMissingRelationError(error.message)) {
      return {
        ok: false,
        reason: "migration_pending",
        message: "Catalogue à initialiser dans Supabase",
      };
    }
    return { ok: false, reason: "error", message: error.message };
  }

  const { error: intErr } = await sb.from("catalog_feature_internals").upsert({
    feature_id: payload.id,
    config_minutes: payload.configMinutes,
  });

  if (intErr) {
    return { ok: false, reason: "error", message: intErr.message };
  }

  return { ok: true };
}

export async function replaceTradeRecommendations(
  tradeSlug: string,
  items: { featureId: string; sortOrder: number; note: string | null }[],
): Promise<{ ok: true } | { ok: false; reason: "migration_pending" | "error"; message: string }> {
  const sb = getSupabase();
  if (!sb) {
    return {
      ok: false,
      reason: "migration_pending",
      message: "Catalogue à initialiser dans Supabase",
    };
  }

  const del = await sb.from("catalog_trade_features").delete().eq("trade_slug", tradeSlug);
  if (del.error) {
    if (isMissingRelationError(del.error.message)) {
      return {
        ok: false,
        reason: "migration_pending",
        message: "Catalogue à initialiser dans Supabase",
      };
    }
    return { ok: false, reason: "error", message: del.error.message };
  }

  if (items.length === 0) return { ok: true };

  const { error } = await sb.from("catalog_trade_features").insert(
    items.map((item) => ({
      trade_slug: tradeSlug,
      feature_id: item.featureId,
      sort_order: item.sortOrder,
      note: item.note,
    })),
  );

  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

/** Liste locale des features (tests / admin hors ligne). */
export function listStaticFeaturesAdmin(): CatalogFeature[] {
  return STATIC_FEATURES;
}
