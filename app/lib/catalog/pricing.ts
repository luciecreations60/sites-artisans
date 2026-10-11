import type { OfferTier } from "~/data/types";
import type {
  CatalogFeaturePublic,
  CatalogPlan,
  CatalogPlanFeature,
  PublicCatalog,
} from "~/data/catalog/types";

export type TaxMode = {
  /** Si fourni, calcule TTC à partir du HT. Aucun taux figé dans le moteur. */
  vatRateBps?: number | null;
};

export type PricingSelection = {
  planId: OfferTier;
  /** Identifiants d’options demandées en plus de la formule. */
  optionFeatureIds?: string[];
  /**
   * Quantités par feature (pages supplémentaires, heures de formation…).
   * Ignorée si absente ou ≤ 0 ; plafonnée côté moteur.
   */
  optionQuantities?: Record<string, number>;
  tax?: TaxMode;
};

const MAX_OPTION_QTY = 99;

export type PricedLine = {
  featureId: string;
  label: string;
  kind: "plan" | "option_setup" | "option_recurring" | "external" | "study" | "skipped";
  amountCents: number | null;
  reason?: string;
};

export type PricingResult = {
  currency: "EUR";
  planId: OfferTier;
  planName: string;
  planSetupCents: number;
  includedFeatureIds: string[];
  optionLines: PricedLine[];
  skipped: PricedLine[];
  incompatibilities: string[];
  missingDependencies: string[];
  /** Sous-total création (formule + options setup commercialisables). */
  creationSubtotalCents: number;
  /** Récurrents séparés (maintenance, etc.). */
  recurringSubtotalCents: number;
  /** Coûts / frais prestataires externes — informatifs, hors création. */
  externalNotes: string[];
  studyRequired: string[];
  tax: {
    vatRateBps: number | null;
    creationHtCents: number;
    creationVatCents: number | null;
    creationTtcCents: number | null;
  };
  warnings: string[];
};

function featureMap(features: CatalogFeaturePublic[]) {
  return new Map(features.map((f) => [f.id, f]));
}

function planLinks(links: CatalogPlanFeature[], planId: OfferTier) {
  return links.filter((l) => l.planId === planId);
}

export function isFeatureOrderable(feature: CatalogFeaturePublic): boolean {
  if (!feature.isAvailable) return false;
  if (feature.status !== "published") return false;
  if (feature.commercialKind === "unavailable") return false;
  if (feature.commercialKind === "not_developed") return false;
  if (feature.commercialKind === "study") return false;
  if (feature.commercialKind === "optional_unpriced") return false;
  // Lien / module externe : commercialisable sans prix Sites Artisans (coût fournisseur à part)
  if (feature.billingType === "external") {
    return feature.commercialKind === "optional_priced" || feature.commercialKind === "included";
  }
  if (feature.commercialKind === "optional_priced") {
    return feature.setupPriceCents != null || feature.recurringPriceCents != null;
  }
  return false;
}

function normalizeQty(raw: number | undefined): number {
  if (raw == null || !Number.isFinite(raw)) return 1;
  const n = Math.floor(raw);
  if (n < 1) return 1;
  return Math.min(MAX_OPTION_QTY, n);
}

/**
 * Moteur de calcul pur.
 * Navigateur = simulation. Devis contractuel = même logique sur catalogue
 * vérifié serveur (source supabase), jamais sur un total client.
 */
export function calculateQuote(catalog: PublicCatalog, selection: PricingSelection): PricingResult {
  const plan = catalog.plans.find((p) => p.id === selection.planId && p.isActive);
  if (!plan) {
    throw new Error(`Formule inconnue ou inactive: ${selection.planId}`);
  }

  const features = featureMap(catalog.features);
  const links = planLinks(catalog.planFeatures, plan.id);
  const includedIds = links.filter((l) => l.inclusion === "included").map((l) => l.featureId);
  const includedSet = new Set(includedIds);
  const unavailableOnPlan = new Set(
    links.filter((l) => l.inclusion === "unavailable").map((l) => l.featureId),
  );

  const warnings: string[] = [];
  const skipped: PricedLine[] = [];
  const optionLines: PricedLine[] = [];
  const incompatibilities: string[] = [];
  const missingDependencies: string[] = [];
  const studyRequired: string[] = [];
  const externalNotes: string[] = [];

  let creationExtra = 0;
  let recurringSubtotal = 0;

  const requested = [...new Set(selection.optionFeatureIds ?? [])];
  const selectedSet = new Set([...includedIds, ...requested]);

  for (const featureId of requested) {
    const feature = features.get(featureId);
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
        reason: "Déjà incluse dans la formule — aucun double paiement",
      });
      continue;
    }

    if (unavailableOnPlan.has(featureId)) {
      skipped.push({
        featureId,
        label: feature.name,
        kind: "skipped",
        amountCents: null,
        reason: "Indisponible pour cette formule",
      });
      continue;
    }

    for (const dep of feature.dependsOn) {
      if (!selectedSet.has(dep) && !includedSet.has(dep)) {
        missingDependencies.push(`${feature.id} → ${dep}`);
      }
    }

    for (const other of feature.incompatibleWith) {
      if (selectedSet.has(other)) {
        incompatibilities.push(`${feature.id} incompatible avec ${other}`);
      }
    }

    if (feature.commercialKind === "study" || feature.billingType === "study") {
      studyRequired.push(feature.id);
      skipped.push({
        featureId,
        label: feature.name,
        kind: "study",
        amountCents: null,
        reason: "Nécessite une étude — aucun montant définitif",
      });
      continue;
    }

    if (feature.commercialKind === "optional_unpriced" || feature.commercialKind === "not_developed") {
      skipped.push({
        featureId,
        label: feature.name,
        kind: "skipped",
        amountCents: null,
        reason:
          feature.commercialKind === "not_developed"
            ? "Non encore développée"
            : "Prix non défini — non commandable à 0 €",
      });
      continue;
    }

    if (feature.billingType === "external" || feature.externalProviderId) {
      if (!feature.isAvailable || feature.status !== "published") {
        skipped.push({
          featureId,
          label: feature.name,
          kind: "skipped",
          amountCents: null,
          reason: "Fonctionnalité indisponible ou non commercialisable",
        });
        continue;
      }
      const provider = catalog.externalProviders.find((p) => p.id === feature.externalProviderId);
      externalNotes.push(
        provider
          ? `${feature.name} — ${provider.name} (${provider.vendorCostNote ?? "coût fournisseur à part"})`
          : `${feature.name} — prestataire externe (coût à part)`,
      );
      optionLines.push({
        featureId,
        label: feature.name,
        kind: "external",
        amountCents: null,
        reason: "Frais prestataire externe — hors prix de création",
      });
      continue;
    }

    if (!isFeatureOrderable(feature) || feature.commercialKind === "unavailable") {
      skipped.push({
        featureId,
        label: feature.name,
        kind: "skipped",
        amountCents: null,
        reason: "Fonctionnalité indisponible ou non commercialisable",
      });
      continue;
    }

    const qty = normalizeQty(selection.optionQuantities?.[featureId]);
    if (qty > 1 && feature.setupPriceCents == null && feature.recurringPriceCents == null) {
      skipped.push({
        featureId,
        label: feature.name,
        kind: "skipped",
        amountCents: null,
        reason: "Quantité demandée sans unité tarifaire — chiffrage incomplet",
      });
      continue;
    }

    if (feature.setupPriceCents != null) {
      if (feature.setupPriceCents <= 0) {
        warnings.push(`${feature.id}: prix setup invalide (≤ 0) ignoré`);
      } else {
        const lineTotal = feature.setupPriceCents * qty;
        creationExtra += lineTotal;
        optionLines.push({
          featureId,
          label: qty > 1 ? `${feature.name} × ${qty}` : feature.name,
          kind: "option_setup",
          amountCents: lineTotal,
          reason: qty > 1 ? `Prix unitaire ${feature.setupPriceCents} centimes × ${qty}` : undefined,
        });
      }
    }

    if (feature.recurringPriceCents != null) {
      if (feature.recurringPriceCents <= 0) {
        warnings.push(`${feature.id}: prix récurrent invalide (≤ 0) ignoré`);
      } else {
        const lineRecurring = feature.recurringPriceCents * qty;
        recurringSubtotal += lineRecurring;
        optionLines.push({
          featureId,
          label: qty > 1 ? `${feature.name} × ${qty}` : feature.name,
          kind: "option_recurring",
          amountCents: lineRecurring,
          reason:
            qty > 1
              ? `Récurrent unitaire ${feature.recurringPriceCents} centimes × ${qty}`
              : "Récurrent — séparé du prix de création",
        });
      }
    }

    if (feature.setupPriceCents == null && feature.recurringPriceCents == null) {
      skipped.push({
        featureId,
        label: feature.name,
        kind: "skipped",
        amountCents: null,
        reason: "Aucun tarif défini",
      });
    }
  }

  const creationSubtotalCents = plan.setupPriceCents + creationExtra;
  const vatRateBps = selection.tax?.vatRateBps ?? null;
  let creationVatCents: number | null = null;
  let creationTtcCents: number | null = null;
  if (vatRateBps != null && vatRateBps >= 0) {
    creationVatCents = Math.round((creationSubtotalCents * vatRateBps) / 10000);
    creationTtcCents = creationSubtotalCents + creationVatCents;
  }

  if (catalog.source !== "supabase") {
    warnings.push(
      "Catalogue de secours — simulation uniquement, pas de devis contractuel.",
    );
  } else {
    warnings.push(
      "Simulation — un devis contractuel nécessite une revalidation serveur.",
    );
  }
  warnings.push("Hébergement et nom de domaine non inclus dans le prix de création.");

  return {
    currency: "EUR",
    planId: plan.id,
    planName: plan.name,
    planSetupCents: plan.setupPriceCents,
    includedFeatureIds: includedIds,
    optionLines,
    skipped,
    incompatibilities,
    missingDependencies,
    creationSubtotalCents,
    recurringSubtotalCents: recurringSubtotal,
    externalNotes,
    studyRequired,
    tax: {
      vatRateBps,
      creationHtCents: creationSubtotalCents,
      creationVatCents,
      creationTtcCents,
    },
    warnings,
  };
}

export function planSetupCents(plan: CatalogPlan): number {
  return plan.setupPriceCents;
}

export function centsToEuroLabel(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** Un devis contractuel ne peut s’appuyer que sur un catalogue Supabase publié. */
export function catalogAllowsContractualQuote(catalog: PublicCatalog): boolean {
  return catalog.source === "supabase" && catalog.migrationPending === false;
}

export function quoteHasBlockingIssues(result: PricingResult): boolean {
  return (
    result.studyRequired.length > 0 ||
    result.incompatibilities.length > 0 ||
    result.missingDependencies.length > 0 ||
    result.skipped.some(
      (s) =>
        s.kind === "study" ||
        s.reason?.includes("Prix non défini") ||
        s.reason?.includes("Aucun tarif") ||
        s.reason?.includes("chiffrage incomplet"),
    )
  );
}
