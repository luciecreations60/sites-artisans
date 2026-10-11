import type { OfferTier } from "../../data/types";
import type { CatalogPlanFeature } from "../../data/catalog/types";
import { STATIC_PLAN_FEATURES } from "../../data/catalog/staticCatalog";
import { CONFIG_STORAGE_KEY, CONFIG_STORAGE_VERSION } from "../configurator/types";

/** Modules UI réellement développés dans les démos (pas le catalogue entier). */
export type DemoModuleId =
  | "gallery_basic"
  | "gallery_filtered"
  | "gallery_before_after"
  | "estimator"
  | "quote_form"
  | "contact_form"
  | "service_area"
  | "testimonials"
  | "services_list"
  | "about_company";

export type DemoModules = Record<DemoModuleId, boolean> & {
  /** Features demandées mais sans composant démo, ou incompatibles avec la formule affichée. */
  unavailableSelected: string[];
  source: "configurator" | "tier_defaults";
};

const IMPLEMENTED: DemoModuleId[] = [
  "gallery_basic",
  "gallery_filtered",
  "gallery_before_after",
  "estimator",
  "quote_form",
  "contact_form",
  "service_area",
  "testimonials",
  "services_list",
  "about_company",
];

function inclusionFor(
  tier: OfferTier,
  featureId: string,
  planFeatures: CatalogPlanFeature[] = STATIC_PLAN_FEATURES,
): string | null {
  return (
    planFeatures.find((l) => l.planId === tier && l.featureId === featureId)?.inclusion ?? null
  );
}

function includedForTier(
  tier: OfferTier,
  planFeatures: CatalogPlanFeature[] = STATIC_PLAN_FEATURES,
): Set<string> {
  return new Set(
    planFeatures.filter((l) => l.planId === tier && l.inclusion === "included").map((l) => l.featureId),
  );
}

function emptyModules(source: DemoModules["source"]): DemoModules {
  return {
    gallery_basic: false,
    gallery_filtered: false,
    gallery_before_after: false,
    estimator: false,
    quote_form: false,
    contact_form: false,
    service_area: false,
    testimonials: false,
    services_list: false,
    about_company: false,
    unavailableSelected: [],
    source,
  };
}

/** Lecture légère (évite d’importer storage → Personalizer sous node:test). */
function readConfiguratorSelection(): { desired: string[]; hasPlan: boolean } {
  if (typeof window === "undefined") return { desired: [], hasPlan: false };
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return { desired: [], hasPlan: false };
    const parsed = JSON.parse(raw) as {
      version?: number;
      desiredFeatureIds?: unknown;
      planId?: unknown;
    };
    if (parsed.version !== CONFIG_STORAGE_VERSION) return { desired: [], hasPlan: false };
    const desired = Array.isArray(parsed.desiredFeatureIds)
      ? parsed.desiredFeatureIds.filter((id): id is string => typeof id === "string")
      : [];
    return { desired, hasPlan: typeof parsed.planId === "string" && parsed.planId.length > 0 };
  } catch {
    return { desired: [], hasPlan: false };
  }
}

/**
 * Modules actifs pour une démo : inclusions de la formule + options
 * du configurateur compatibles, limitées aux composants réellement développés.
 */
export function resolveDemoModules(
  tier: OfferTier,
  options?: {
    desiredFeatureIds?: string[];
    hasConfigurator?: boolean;
    /** Si fourni (ex. catalogue Supabase), remplace STATIC_PLAN_FEATURES. */
    planFeatures?: CatalogPlanFeature[];
  },
): DemoModules {
  const planFeatures = options?.planFeatures ?? STATIC_PLAN_FEATURES;
  const included = includedForTier(tier, planFeatures);
  const fromStorage =
    options?.desiredFeatureIds !== undefined ? null : readConfiguratorSelection();
  const desired = options?.desiredFeatureIds ?? fromStorage?.desired ?? [];
  const hasConfigurator =
    options?.hasConfigurator ??
    (options?.desiredFeatureIds !== undefined ||
      Boolean(desired.length) ||
      Boolean(fromStorage?.hasPlan));

  const modules = emptyModules(hasConfigurator ? "configurator" : "tier_defaults");
  const unavailable: string[] = [];

  for (const id of IMPLEMENTED) {
    const status = inclusionFor(tier, id, planFeatures);
    if (included.has(id)) {
      modules[id] = true;
      continue;
    }
    if (desired.includes(id)) {
      if (status === "unavailable") {
        unavailable.push(id);
        continue;
      }
      modules[id] = true;
    }
  }

  // Socle toujours présent pour une démo crédible
  modules.contact_form = true;
  modules.services_list = true;
  modules.about_company = true;
  modules.gallery_basic = true;

  if (tier === "avance" || tier === "pro") {
    if (included.has("gallery_filtered")) modules.gallery_filtered = true;
    if (included.has("quote_form")) modules.quote_form = true;
  }
  if (tier === "pro") {
    if (included.has("gallery_before_after")) modules.gallery_before_after = true;
    if (included.has("estimator")) modules.estimator = true;
  }

  for (const id of desired) {
    if ((IMPLEMENTED as string[]).includes(id)) continue;
    if (included.has(id)) continue;
    if (inclusionFor(tier, id, planFeatures) === "unavailable") {
      unavailable.push(`${id} (indisponible en ${tier})`);
      continue;
    }
    unavailable.push(id);
  }

  modules.unavailableSelected = [...new Set(unavailable)];
  return modules;
}

export function demoHrefForConfig(tradeSlug: string, planId: OfferTier): string {
  return `/demos/${tradeSlug}/${planId}`;
}

export const DEMO_TIERS: OfferTier[] = ["essentiel", "avance", "pro"];
