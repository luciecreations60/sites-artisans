import type { OfferTier, TradeSlug } from "~/data/types";
import type { Profile } from "~/lib/personalize";

export const CONFIG_STORAGE_KEY = "sa-configurator-v1";
export const CONFIG_STORAGE_VERSION = 1 as const;

export type ConfiguratorStep = 1 | 2 | 3 | 4 | 5;

export type ConfiguratorPath = "formula" | "compose";

export type ConfiguratorState = {
  version: typeof CONFIG_STORAGE_VERSION;
  step: ConfiguratorStep;
  tradeSlug: TradeSlug | null;
  path: ConfiguratorPath | null;
  planId: OfferTier | null;
  desiredFeatureIds: string[];
  /** Quantités d’options facturées à l’unité (pages, heures…). */
  featureQuantities?: Record<string, number>;
  /** Identifiant local stable pour suivi / lot 6. */
  clientLocalId?: string;
  profile: Profile;
  updatedAt: string;
};

export type ConfiguratorBootParams = {
  trade?: string | null;
  formule?: string | null;
  parcours?: string | null;
};
