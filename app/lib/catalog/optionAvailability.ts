import type { OfferTier } from "~/data/types";
import type { CatalogFeaturePublic, PlanFeatureInclusion, PublicCatalog } from "~/data/catalog/types";

function isOrderable(feature: CatalogFeaturePublic): boolean {
  if (!feature.isAvailable) return false;
  if (feature.status !== "published") return false;
  if (feature.commercialKind === "unavailable") return false;
  if (feature.commercialKind === "not_developed") return false;
  if (feature.commercialKind === "study") return false;
  if (feature.commercialKind === "optional_unpriced") return false;
  if (feature.billingType === "external") {
    return feature.commercialKind === "optional_priced" || feature.commercialKind === "included";
  }
  if (feature.commercialKind === "optional_priced") {
    return feature.setupPriceCents != null || feature.recurringPriceCents != null;
  }
  return false;
}

/** Statut commercial unifié pour le configurateur / démos / devis. */
export type OptionAvailabilityKind =
  | "included"
  | "optional_priced"
  | "incompatible"
  | "not_developed"
  | "unpriced"
  | "study"
  | "unavailable";

export type OptionAvailability = {
  featureId: string;
  kind: OptionAvailabilityKind;
  /** Peut être cochée comme option payante / complémentaire. */
  selectable: boolean;
  planInclusion: PlanFeatureInclusion | null;
  reason?: string;
};

/**
 * Classe une fonctionnalité pour une formule donnée.
 * Ne modifie jamais le catalogue — lecture seule.
 */
export function classifyOption(
  catalog: PublicCatalog,
  planId: OfferTier,
  featureId: string,
): OptionAvailability {
  const feature = catalog.features.find((f) => f.id === featureId);
  const link = catalog.planFeatures.find(
    (l) => l.planId === planId && l.featureId === featureId,
  );
  const planInclusion = link?.inclusion ?? null;

  if (!feature) {
    return {
      featureId,
      kind: "unavailable",
      selectable: false,
      planInclusion,
      reason: "Fonctionnalité inconnue",
    };
  }

  if (planInclusion === "included") {
    return { featureId, kind: "included", selectable: false, planInclusion };
  }

  if (planInclusion === "unavailable") {
    return {
      featureId,
      kind: "incompatible",
      selectable: false,
      planInclusion,
      reason: `Incompatible avec la formule ${planId}`,
    };
  }

  if (feature.commercialKind === "not_developed" || feature.devStatus === "todo") {
    return {
      featureId,
      kind: "not_developed",
      selectable: false,
      planInclusion,
      reason: "Module non développé",
    };
  }

  if (feature.commercialKind === "study" || feature.billingType === "study") {
    return {
      featureId,
      kind: "study",
      selectable: true,
      planInclusion,
      reason: "Nécessite une étude — montant non définitif",
    };
  }

  if (feature.commercialKind === "unavailable") {
    return {
      featureId,
      kind: "unavailable",
      selectable: false,
      planInclusion,
      reason: "Indisponible commercialement",
    };
  }

  if (feature.commercialKind === "optional_unpriced") {
    return {
      featureId,
      kind: "unpriced",
      selectable: false,
      planInclusion,
      reason: "Sans tarif validé",
    };
  }

  if (isOrderable(feature) || feature.billingType === "external") {
    return {
      featureId,
      kind: "optional_priced",
      selectable: true,
      planInclusion: planInclusion ?? "optional",
    };
  }

  return {
    featureId,
    kind: "unpriced",
    selectable: false,
    planInclusion,
    reason: "Non commercialisable pour le moment",
  };
}

export function listSelectableOptions(
  catalog: PublicCatalog,
  planId: OfferTier,
): { feature: CatalogFeaturePublic; availability: OptionAvailability }[] {
  return catalog.features
    .filter((f) => f.status === "published")
    .map((feature) => ({
      feature,
      availability: classifyOption(catalog, planId, feature.id),
    }))
    .filter((row) => row.availability.selectable || row.availability.kind === "included");
}

/**
 * Associations plan×feature encore « unavailable » dans le catalogue statique
 * pour lesquelles un passage en « optional » mérite un arbitrage commercial
 * (ne pas appliquer automatiquement).
 */
export const PLAN_INCLUSION_ARBITRATION: {
  planId: OfferTier;
  featureId: string;
  proposal: "optional";
  note: string;
}[] = [
  {
    planId: "essentiel",
    featureId: "quote_form",
    proposal: "optional",
    note: "Devis guidé en supplément sur Essentiel si développé et tarifé",
  },
  {
    planId: "essentiel",
    featureId: "gallery_filtered",
    proposal: "optional",
    note: "Galerie filtrable en option Essentiel",
  },
  {
    planId: "avance",
    featureId: "gallery_before_after",
    proposal: "optional",
    note: "Avant/après en option Avancé (déjà inclus en Pro)",
  },
  {
    planId: "avance",
    featureId: "estimator",
    proposal: "optional",
    note: "Estimateur artisan en option Avancé",
  },
  {
    planId: "essentiel",
    featureId: "gallery_before_after",
    proposal: "optional",
    note: "Avant/après en option Essentiel — à valider techniquement",
  },
  {
    planId: "essentiel",
    featureId: "estimator",
    proposal: "optional",
    note: "Estimateur en option Essentiel — à valider techniquement",
  },
];
