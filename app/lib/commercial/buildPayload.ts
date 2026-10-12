import type { ConfiguratorState } from "~/lib/configurator/types";
import type { CommercialSubmitPayload } from "./types";

export function ensureClientLocalId(state: ConfiguratorState): string {
  if (state.clientLocalId) return state.clientLocalId;
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function buildCommercialPayload(input: {
  state: ConfiguratorState;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  message?: string;
  contactPreference?: "email" | "phone" | "either";
  clientClaimedCreationCents: number | null;
}): CommercialSubmitPayload | { error: string } {
  const { state } = input;
  if (!state.tradeSlug) return { error: "Métier manquant dans la configuration." };
  if (!state.planId) return { error: "Formule manquante dans la configuration." };
  if (!state.path) return { error: "Parcours manquant dans la configuration." };

  const client_local_id = ensureClientLocalId(state);
  const client_request_id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `req-${Date.now()}`;

  return {
    client_request_id,
    client_local_id,
    contact_name: input.contactName.trim(),
    contact_email: input.contactEmail.trim(),
    contact_phone: input.contactPhone?.trim() || undefined,
    company_name: state.profile.company || undefined,
    message: input.message?.trim() || undefined,
    contact_preference: input.contactPreference,
    trade_slug: state.tradeSlug,
    plan_id: state.planId,
    path: state.path,
    specialty: state.profile.specialty || undefined,
    city: state.profile.city || undefined,
    theme_id: state.profile.themeId || undefined,
    font_id: state.profile.fontId || undefined,
    desired_feature_ids: state.desiredFeatureIds,
    feature_quantities: state.featureQuantities ?? {},
    profile_snapshot: state.profile,
    client_claimed_creation_cents: input.clientClaimedCreationCents,
  };
}

/** Lien démo fidèle à la config (métier + formule). */
export function demoPreviewHref(tradeSlug: string, planId: string): string {
  return `/demos/${tradeSlug}/${planId}`;
}
