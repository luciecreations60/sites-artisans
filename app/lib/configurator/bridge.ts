/**
 * Pont unique démo ↔ configurateur.
 * Une seule source commerciale : sa-configurator-v1 (+ sync sa-profile).
 */
import type { OfferTier, TradeSlug } from "../../data/types";
import type { Profile } from "../personalize";
import {
  loadConfiguratorState,
  saveConfiguratorState,
} from "./storage";
import type { ConfiguratorState } from "./types";

/** URL configurateur préremplie depuis un modèle de démo. */
export function configuratorHrefFromDemo(
  tradeSlug: string,
  planId: OfferTier,
  opts?: { step?: number },
): string {
  const params = new URLSearchParams({
    metier: tradeSlug,
    formule: planId,
    parcours: "formula",
  });
  if (opts?.step != null) params.set("etape", String(opts.step));
  return `/configurateur?${params.toString()}`;
}

/** URL démo plein écran pour une configuration. */
export function demoHrefFromConfig(tradeSlug: string, planId: OfferTier): string {
  return `/demos/${tradeSlug}/${planId}`;
}

/**
 * Applique métier / formule depuis une démo sans effacer profil ni options.
 * Les options incompatibles restent en mémoire ; resolveDemoModules les filtre à l’affichage.
 */
export function applyDemoSelectionToConfigurator(
  state: ConfiguratorState,
  tradeSlug: TradeSlug,
  planId: OfferTier,
): ConfiguratorState {
  return {
    ...state,
    tradeSlug,
    planId,
    path: state.path ?? "formula",
    step: state.step < 3 ? 3 : state.step,
    updatedAt: new Date().toISOString(),
  };
}

/** Synchronise le Profile (Personalizer) dans l’état configurateur sans perdre le reste. */
export function syncProfileIntoConfigurator(
  profile: Profile,
  opts?: { tradeSlug?: TradeSlug | null },
): ConfiguratorState {
  const current = loadConfiguratorState();
  const next: ConfiguratorState = {
    ...current,
    profile,
    tradeSlug: opts?.tradeSlug !== undefined ? opts.tradeSlug : current.tradeSlug,
  };
  saveConfiguratorState(next);
  return next;
}

/** Persiste métier + formule depuis la galerie / chrome démo, conserve personnalisation. */
export function persistDemoEntry(
  tradeSlug: TradeSlug,
  planId: OfferTier,
): ConfiguratorState {
  const current = loadConfiguratorState();
  const next = applyDemoSelectionToConfigurator(current, tradeSlug, planId);
  saveConfiguratorState(next);
  return next;
}

/** Libellés UX unifiés (éviter Démo / Essayer / Configurer en concurrence). */
export const UX_LABELS = {
  gallery: "Exemples de sites",
  personalizeModel: "Personnaliser ce modèle",
  personalizeMine: "Personnaliser mon site",
  viewFullscreen: "Voir le site en grand",
  comparePlans: "Comparer les formules",
  backToConfig: "Revenir à ma configuration",
  adjustPreview: "Ajuster l’aperçu",
} as const;
