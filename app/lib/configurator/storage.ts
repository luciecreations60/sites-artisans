import { emptyProfile, loadProfile, saveProfile, type Profile } from "~/lib/personalize";
import type { OfferTier, TradeSlug } from "~/data/types";
import { TRADE_SLUGS } from "~/data/trades";
import {
  CONFIG_STORAGE_KEY,
  CONFIG_STORAGE_VERSION,
  type ConfiguratorBootParams,
  type ConfiguratorPath,
  type ConfiguratorState,
  type ConfiguratorStep,
} from "./types";

const TIERS: OfferTier[] = ["essentiel", "avance", "pro"];

export function emptyConfiguratorState(): ConfiguratorState {
  return {
    version: CONFIG_STORAGE_VERSION,
    step: 1,
    tradeSlug: null,
    path: null,
    planId: null,
    desiredFeatureIds: [],
    featureQuantities: {},
    clientLocalId: undefined,
    profile: emptyProfile(),
    updatedAt: new Date().toISOString(),
  };
}

function isTradeSlug(value: string | null | undefined): value is TradeSlug {
  return Boolean(value && (TRADE_SLUGS as string[]).includes(value));
}

function isTier(value: string | null | undefined): value is OfferTier {
  return Boolean(value && (TIERS as string[]).includes(value));
}

export function loadConfiguratorState(): ConfiguratorState {
  const base = emptyConfiguratorState();
  const profile = loadProfile() ?? emptyProfile();
  base.profile = profile;

  if (typeof window === "undefined") return base;

  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<ConfiguratorState>;
    if (parsed.version !== CONFIG_STORAGE_VERSION) {
      return { ...base, profile };
    }
    return {
      version: CONFIG_STORAGE_VERSION,
      step: ([1, 2, 3, 4, 5] as ConfiguratorStep[]).includes(parsed.step as ConfiguratorStep)
        ? (parsed.step as ConfiguratorStep)
        : 1,
      tradeSlug: isTradeSlug(parsed.tradeSlug ?? null) ? parsed.tradeSlug! : null,
      path:
        parsed.path === "formula" || parsed.path === "compose"
          ? (parsed.path as ConfiguratorPath)
          : null,
      planId: isTier(parsed.planId ?? null) ? parsed.planId! : null,
      desiredFeatureIds: Array.isArray(parsed.desiredFeatureIds)
        ? parsed.desiredFeatureIds.filter((id): id is string => typeof id === "string")
        : [],
      featureQuantities:
        parsed.featureQuantities && typeof parsed.featureQuantities === "object"
          ? Object.fromEntries(
              Object.entries(parsed.featureQuantities).filter(
                ([, v]) => typeof v === "number" && Number.isFinite(v) && v > 0,
              ),
            )
          : {},
      clientLocalId:
        typeof parsed.clientLocalId === "string" && parsed.clientLocalId.length > 0
          ? parsed.clientLocalId
          : undefined,
      profile: { ...emptyProfile(), ...profile, ...(parsed.profile ?? {}) },
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : base.updatedAt,
    };
  } catch {
    return base;
  }
}

export function saveConfiguratorState(state: ConfiguratorState): void {
  if (typeof window === "undefined") return;
  const next: ConfiguratorState = {
    ...state,
    version: CONFIG_STORAGE_VERSION,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(next));
  // Synchronise le profil démos / Personalizer
  saveProfile(next.profile);
}

export function clearConfiguratorState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CONFIG_STORAGE_KEY);
}

/** Fusionne URL + état local (URL prioritaire pour métier / formule / parcours). */
export function mergeBootParams(
  state: ConfiguratorState,
  params: ConfiguratorBootParams,
): ConfiguratorState {
  let next = { ...state };
  if (isTradeSlug(params.trade ?? null)) {
    next = { ...next, tradeSlug: params.trade as TradeSlug };
    if (next.step < 2) next = { ...next, step: 2 };
  }
  if (params.parcours === "formula" || params.parcours === "compose") {
    next = { ...next, path: params.parcours };
    if (next.step < 3) next = { ...next, step: 3 };
  }
  if (isTier(params.formule ?? null)) {
    next = {
      ...next,
      planId: params.formule as OfferTier,
      path: next.path ?? "formula",
    };
    if (next.step < 3) next = { ...next, step: 3 };
  }
  const etapeNum = params.etape != null ? Number(params.etape) : NaN;
  if ([1, 2, 3, 4, 5].includes(etapeNum)) {
    next = { ...next, step: etapeNum as ConfiguratorStep };
  }
  return next;
}

export function formatConfigSummary(state: ConfiguratorState): string {
  const lines = [
    "Configuration Site AZ",
    `Métier : ${state.tradeSlug ?? "—"}`,
    `Parcours : ${state.path === "compose" ? "Composition libre" : state.path === "formula" ? "Formule" : "—"}`,
    `Formule : ${state.planId ?? "—"}`,
    `Entreprise : ${state.profile.company || "—"}`,
    `Ville : ${state.profile.city || "—"}`,
    `Spécialité : ${state.profile.specialty || "—"}`,
    `Options souhaitées : ${state.desiredFeatureIds.join(", ") || "aucune"}`,
    "",
    "(Simulation — à confirmer après échange)",
  ];
  return lines.join("\n");
}

export function syncProfileSlice(profile: Profile): void {
  saveProfile(profile);
}
