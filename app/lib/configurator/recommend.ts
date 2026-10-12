import type { OfferTier } from "~/data/types";
import type { PublicCatalog } from "~/data/catalog/types";
import { calculateQuote, centsToEuroLabel } from "~/lib/catalog/pricing";

export type PlanScenario = {
  planId: OfferTier;
  planName: string;
  /** Total création chiffrable (formule + options payantes). */
  creationTotalCents: number;
  /** true si toutes les options désirées sont soit incluses, soit tarifées, soit externes. */
  complete: boolean;
  /** Options encore payantes en plus de la formule. */
  extraFeatureIds: string[];
  studyOrUnpricedIds: string[];
  unavailableIds: string[];
  missingDependencyIds: string[];
};

export type RecommendationResult = {
  scenarios: PlanScenario[];
  /** Meilleure formule parmi les scénarios complets, sinon null. */
  bestPlanId: OfferTier | null;
  savingsVsCurrentCents: number | null;
  message: string | null;
};

function scenarioForPlan(
  catalog: PublicCatalog,
  planId: OfferTier,
  desiredFeatureIds: string[],
): PlanScenario | null {
  const plan = catalog.plans.find((p) => p.id === planId && p.isActive);
  if (!plan) return null;

  const links = catalog.planFeatures.filter((l) => l.planId === planId);
  const included = new Set(links.filter((l) => l.inclusion === "included").map((l) => l.featureId));
  const unavailable = new Set(
    links.filter((l) => l.inclusion === "unavailable").map((l) => l.featureId),
  );
  const featureById = new Map(catalog.features.map((f) => [f.id, f]));

  const extraFeatureIds: string[] = [];
  const studyOrUnpricedIds: string[] = [];
  const unavailableIds: string[] = [];
  const missingDependencyIds: string[] = [];

  for (const id of desiredFeatureIds) {
    if (included.has(id)) continue;
    if (unavailable.has(id)) {
      unavailableIds.push(id);
      continue;
    }
    const feature = featureById.get(id);
    if (!feature) {
      studyOrUnpricedIds.push(id);
      continue;
    }
    for (const dep of feature.dependsOn) {
      if (!included.has(dep) && !desiredFeatureIds.includes(dep)) {
        missingDependencyIds.push(`${id}→${dep}`);
      }
    }
    if (
      feature.commercialKind === "study" ||
      feature.commercialKind === "optional_unpriced" ||
      feature.commercialKind === "not_developed" ||
      feature.billingType === "study"
    ) {
      studyOrUnpricedIds.push(id);
      continue;
    }
    if (feature.billingType === "external") {
      // Coût fournisseur hors total — n’empêche pas la complétude du prix de création
      continue;
    }
    if (feature.setupPriceCents != null && feature.setupPriceCents > 0) {
      extraFeatureIds.push(id);
      continue;
    }
    studyOrUnpricedIds.push(id);
  }

  const quote = calculateQuote(catalog, {
    planId,
    optionFeatureIds: extraFeatureIds,
  });

  const complete =
    unavailableIds.length === 0 &&
    studyOrUnpricedIds.length === 0 &&
    missingDependencyIds.length === 0;

  return {
    planId,
    planName: plan.name,
    creationTotalCents: quote.creationSubtotalCents,
    complete,
    extraFeatureIds,
    studyOrUnpricedIds,
    unavailableIds,
    missingDependencyIds,
  };
}

/**
 * Compare Essentiel / Avancé / Pro pour un ensemble de besoins.
 * Ne recommande jamais sur la base d’un prix incomplet.
 */
export function recommendPlans(
  catalog: PublicCatalog,
  desiredFeatureIds: string[],
  currentPlanId: OfferTier | null,
): RecommendationResult {
  const order: OfferTier[] = ["essentiel", "avance", "pro"];
  const scenarios = order
    .map((id) => scenarioForPlan(catalog, id, desiredFeatureIds))
    .filter((s): s is PlanScenario => Boolean(s));

  const complete = scenarios.filter((s) => s.complete);
  if (complete.length === 0) {
    return {
      scenarios,
      bestPlanId: null,
      savingsVsCurrentCents: null,
      message:
        desiredFeatureIds.length === 0
          ? null
          : "Certaines options nécessitent une étude ou un tarif à préciser — aucune recommandation automatique fiable pour le moment.",
    };
  }

  complete.sort((a, b) => a.creationTotalCents - b.creationTotalCents);
  const best = complete[0];

  let savingsVsCurrentCents: number | null = null;
  let message: string | null = null;

  if (currentPlanId && currentPlanId !== best.planId) {
    const current = scenarios.find((s) => s.planId === currentPlanId);
    if (current?.complete && current.creationTotalCents > best.creationTotalCents) {
      savingsVsCurrentCents = current.creationTotalCents - best.creationTotalCents;
      message = `Une formule pourrait mieux vous convenir. ${best.planName} couvre vos besoins sélectionnés et vous pourriez économiser ${centsToEuroLabel(savingsVsCurrentCents)} en la choisissant.`;
    }
  } else if (!currentPlanId) {
    message = `D’après vos choix, ${best.planName} est la formule compatible la plus avantageuse (${centsToEuroLabel(best.creationTotalCents)} de création chiffrable).`;
  }

  return {
    scenarios,
    bestPlanId: best.planId,
    savingsVsCurrentCents,
    message,
  };
}

export function quoteIsPartial(
  catalog: PublicCatalog,
  planId: OfferTier,
  desiredFeatureIds: string[],
): { partial: boolean; reasons: string[] } {
  const scenario = scenarioForPlan(catalog, planId, desiredFeatureIds);
  if (!scenario) return { partial: true, reasons: ["Formule indisponible"] };
  const reasons: string[] = [];
  if (scenario.studyOrUnpricedIds.length) {
    reasons.push("Une ou plusieurs options sont sur étude ou sans tarif défini");
  }
  if (scenario.unavailableIds.length) {
    reasons.push("Certaines options ne sont pas disponibles dans cette formule");
  }
  return { partial: !scenario.complete, reasons };
}
