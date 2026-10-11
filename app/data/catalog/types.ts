import type { OfferTier, TradeSlug } from "~/data/types";

export type CatalogCurrency = "EUR";

export type CatalogPublishStatus = "draft" | "published";

export type FeatureCategory =
  | "presentation"
  | "interactions"
  | "services";

/** Statut commercial côté catalogue (pas le statut de publication). */
export type FeatureCommercialKind =
  | "included" // typiquement incluse dans une formule
  | "optional_priced" // option payante avec prix défini
  | "optional_unpriced" // option sans prix validé — non commandable
  | "study" // nécessite une étude — pas de montant définitif
  | "unavailable" // indisponible
  | "not_developed"; // pas encore développée

export type FeatureBillingType =
  | "none"
  | "setup"
  | "recurring"
  | "setup_and_recurring"
  | "external"
  | "study";

export type FeatureDevStatus = "ready" | "partial" | "todo";

export type PlanFeatureInclusion = "included" | "optional" | "unavailable";

export type ExternalIntegrationLevel = "link" | "widget" | "api";

export type CatalogPlan = {
  id: OfferTier;
  name: string;
  description: string;
  /** Prix de création en centimes (entiers). */
  setupPriceCents: number;
  currency: CatalogCurrency;
  sortOrder: number;
  isActive: boolean;
  status: CatalogPublishStatus;
  updatedAt: string;
};

export type CatalogExternalProvider = {
  id: string;
  name: string;
  integrationLevel: ExternalIntegrationLevel;
  notes: string;
  /** Abonnement / coût fournisseur — informatif, jamais mélangé au prix de création. */
  vendorCostNote: string | null;
};

/** Données commerciales exposables (public / client). */
export type CatalogFeaturePublic = {
  id: string;
  category: FeatureCategory;
  name: string;
  description: string;
  setupPriceCents: number | null;
  recurringPriceCents: number | null;
  billingType: FeatureBillingType;
  commercialKind: FeatureCommercialKind;
  isAvailable: boolean;
  status: CatalogPublishStatus;
  personalizationLevel: "none" | "light" | "medium" | "deep";
  devStatus: FeatureDevStatus;
  sortOrder: number;
  externalProviderId: string | null;
  dependsOn: string[];
  incompatibleWith: string[];
};

/** Paramètres internes — jamais exposés au public. */
export type CatalogFeatureInternal = {
  featureId: string;
  /** Temps de configuration estimé (minutes) — interne. */
  configMinutes: number | null;
  complexity: "low" | "medium" | "high" | null;
  profitabilityNote: string | null;
};

export type CatalogFeature = CatalogFeaturePublic & {
  internal?: CatalogFeatureInternal;
};

export type CatalogPlanFeature = {
  planId: OfferTier;
  featureId: string;
  inclusion: PlanFeatureInclusion;
  variantLabel: string | null;
};

export type CatalogTradeFeature = {
  tradeSlug: TradeSlug;
  featureId: string;
  sortOrder: number;
  note: string | null;
};

export type PublicCatalog = {
  source: "static" | "supabase";
  plans: CatalogPlan[];
  features: CatalogFeaturePublic[];
  planFeatures: CatalogPlanFeature[];
  tradeFeatures: CatalogTradeFeature[];
  externalProviders: CatalogExternalProvider[];
  /** true si les tables Supabase ne sont pas encore disponibles. */
  migrationPending: boolean;
};

export type AdminCatalog = PublicCatalog & {
  featuresAdmin: CatalogFeature[];
};
