/**
 * Recalcul tarifaire serveur (Deno) — miroir de app/lib/catalog/pricing.ts.
 * Ne jamais faire confiance à un total navigateur.
 */

export type OfferTier = "essentiel" | "avance" | "pro";

export type PublicFeature = {
  id: string;
  name: string;
  setup_price_cents: number | null;
  recurring_price_cents: number | null;
  billing_type: string;
  commercial_kind: string;
  is_available: boolean;
  status: string;
  external_provider_id: string | null;
  depends_on: string[] | null;
  incompatible_with: string[] | null;
};

export type PlanRow = {
  id: OfferTier;
  name: string;
  setup_price_cents: number;
  is_active: boolean;
  status: string;
};

export type PlanFeatureRow = {
  plan_id: OfferTier;
  feature_id: string;
  inclusion: "included" | "optional" | "unavailable";
};

export type ProviderRow = {
  id: string;
  name: string;
  vendor_cost_note: string | null;
};

export type ServerPricingInput = {
  planId: OfferTier;
  optionFeatureIds: string[];
  optionQuantities?: Record<string, number>;
  vatRateBps?: number | null;
};

export type ServerPricedLine = {
  featureId: string;
  label: string;
  kind: string;
  amountCents: number | null;
  reason?: string;
};

export type ServerPricingResult = {
  planId: OfferTier;
  planName: string;
  planSetupCents: number;
  includedFeatureIds: string[];
  optionLines: ServerPricedLine[];
  skipped: ServerPricedLine[];
  incompatibilities: string[];
  missingDependencies: string[];
  creationSubtotalCents: number;
  recurringSubtotalCents: number;
  externalNotes: string[];
  studyRequired: string[];
  pricingComplete: boolean;
  tax: {
    vatRateBps: number | null;
    creationHtCents: number;
    creationVatCents: number | null;
    creationTtcCents: number | null;
  };
  warnings: string[];
};

const MAX_QTY = 99;

function qtyOf(map: Record<string, number> | undefined, id: string): number {
  const raw = map?.[id];
  if (raw == null || !Number.isFinite(raw)) return 1;
  const n = Math.floor(raw);
  if (n < 1) return 1;
  return Math.min(MAX_QTY, n);
}

function orderable(f: PublicFeature): boolean {
  if (!f.is_available || f.status !== "published") return false;
  if (["unavailable", "not_developed", "study", "optional_unpriced"].includes(f.commercial_kind)) {
    return false;
  }
  if (f.billing_type === "external") {
    return f.commercial_kind === "optional_priced" || f.commercial_kind === "included";
  }
  if (f.commercial_kind === "optional_priced") {
    return f.setup_price_cents != null || f.recurring_price_cents != null;
  }
  return false;
}

export function calculateServerQuote(
  plans: PlanRow[],
  features: PublicFeature[],
  links: PlanFeatureRow[],
  providers: ProviderRow[],
  selection: ServerPricingInput,
): ServerPricingResult {
  const plan = plans.find((p) => p.id === selection.planId && p.is_active && p.status === "published");
  if (!plan) throw new Error(`Formule inconnue ou inactive: ${selection.planId}`);

  const fmap = new Map(features.map((f) => [f.id, f]));
  const planLinks = links.filter((l) => l.plan_id === plan.id);
  const includedIds = planLinks.filter((l) => l.inclusion === "included").map((l) => l.feature_id);
  const includedSet = new Set(includedIds);
  const unavailable = new Set(
    planLinks.filter((l) => l.inclusion === "unavailable").map((l) => l.feature_id),
  );

  const warnings: string[] = [];
  const skipped: ServerPricedLine[] = [];
  const optionLines: ServerPricedLine[] = [];
  const incompatibilities: string[] = [];
  const missingDependencies: string[] = [];
  const studyRequired: string[] = [];
  const externalNotes: string[] = [];
  let creationExtra = 0;
  let recurringSubtotal = 0;

  const requested = [...new Set(selection.optionFeatureIds)];
  const selectedSet = new Set([...includedIds, ...requested]);

  for (const featureId of requested) {
    const feature = fmap.get(featureId);
    if (!feature) {
      skipped.push({
        featureId,
        label: featureId,
        kind: "skipped",
        amountCents: null,
        reason: "Fonctionnalité inconnue",
      });
      continue;
    }
    if (includedSet.has(featureId)) {
      skipped.push({
        featureId,
        label: feature.name,
        kind: "skipped",
        amountCents: null,
        reason: "Déjà incluse — aucun double paiement",
      });
      continue;
    }
    if (unavailable.has(featureId)) {
      skipped.push({
        featureId,
        label: feature.name,
        kind: "skipped",
        amountCents: null,
        reason: "Indisponible pour cette formule",
      });
      incompatibilities.push(`${featureId} incompatible avec ${plan.id}`);
      continue;
    }

    for (const dep of feature.depends_on ?? []) {
      if (!selectedSet.has(dep) && !includedSet.has(dep)) {
        missingDependencies.push(`${feature.id} → ${dep}`);
      }
    }
    for (const other of feature.incompatible_with ?? []) {
      if (selectedSet.has(other)) {
        incompatibilities.push(`${feature.id} incompatible avec ${other}`);
      }
    }

    if (feature.commercial_kind === "study" || feature.billing_type === "study") {
      studyRequired.push(feature.id);
      skipped.push({
        featureId,
        label: feature.name,
        kind: "study",
        amountCents: null,
        reason: "Nécessite une étude",
      });
      continue;
    }

    if (
      feature.commercial_kind === "optional_unpriced" ||
      feature.commercial_kind === "not_developed"
    ) {
      skipped.push({
        featureId,
        label: feature.name,
        kind: "skipped",
        amountCents: null,
        reason: "Non commercialisable / non tarifée",
      });
      continue;
    }

    if (feature.billing_type === "external" || feature.external_provider_id) {
      const provider = providers.find((p) => p.id === feature.external_provider_id);
      externalNotes.push(
        provider
          ? `${feature.name} — ${provider.name}`
          : `${feature.name} — prestataire externe`,
      );
      optionLines.push({
        featureId,
        label: feature.name,
        kind: "external",
        amountCents: null,
        reason: "Frais externes",
      });
      continue;
    }

    if (!orderable(feature)) {
      skipped.push({
        featureId,
        label: feature.name,
        kind: "skipped",
        amountCents: null,
        reason: "Non commercialisable",
      });
      continue;
    }

    const qty = qtyOf(selection.optionQuantities, featureId);
    if (feature.setup_price_cents != null && feature.setup_price_cents > 0) {
      const total = feature.setup_price_cents * qty;
      creationExtra += total;
      optionLines.push({
        featureId,
        label: qty > 1 ? `${feature.name} × ${qty}` : feature.name,
        kind: "option_setup",
        amountCents: total,
      });
    }
    if (feature.recurring_price_cents != null && feature.recurring_price_cents > 0) {
      const total = feature.recurring_price_cents * qty;
      recurringSubtotal += total;
      optionLines.push({
        featureId,
        label: qty > 1 ? `${feature.name} × ${qty}` : feature.name,
        kind: "option_recurring",
        amountCents: total,
        reason: "Récurrent",
      });
    }
    if (feature.setup_price_cents == null && feature.recurring_price_cents == null) {
      skipped.push({
        featureId,
        label: feature.name,
        kind: "skipped",
        amountCents: null,
        reason: "Aucun tarif défini",
      });
    }
  }

  const creationSubtotalCents = plan.setup_price_cents + creationExtra;
  const vatRateBps = selection.vatRateBps ?? null;
  let creationVatCents: number | null = null;
  let creationTtcCents: number | null = null;
  if (vatRateBps != null && vatRateBps >= 0) {
    creationVatCents = Math.round((creationSubtotalCents * vatRateBps) / 10000);
    creationTtcCents = creationSubtotalCents + creationVatCents;
  }

  const pricingComplete =
    studyRequired.length === 0 &&
    incompatibilities.length === 0 &&
    missingDependencies.length === 0 &&
    !skipped.some(
      (s) =>
        s.kind === "study" ||
        (s.reason?.includes("tarif") ?? false) ||
        (s.reason?.includes("Non commercialisable") ?? false),
    );

  warnings.push("Recalcul serveur — catalogue Supabase.");
  warnings.push("Hébergement non inclus.");

  return {
    planId: plan.id,
    planName: plan.name,
    planSetupCents: plan.setup_price_cents,
    includedFeatureIds: includedIds,
    optionLines,
    skipped,
    incompatibilities,
    missingDependencies,
    creationSubtotalCents,
    recurringSubtotalCents: recurringSubtotal,
    externalNotes,
    studyRequired,
    pricingComplete,
    tax: {
      vatRateBps,
      creationHtCents: creationSubtotalCents,
      creationVatCents,
      creationTtcCents,
    },
    warnings,
  };
}

export function catalogFingerprint(plans: PlanRow[], features: PublicFeature[]): string {
  const planPart = plans
    .map((p) => `${p.id}:${p.setup_price_cents}`)
    .sort()
    .join("|");
  const featPart = features
    .map(
      (f) =>
        `${f.id}:${f.setup_price_cents ?? "x"}:${f.recurring_price_cents ?? "x"}:${f.commercial_kind}`,
    )
    .sort()
    .join("|");
  return `v1:${planPart}::${featPart}`.slice(0, 500);
}
