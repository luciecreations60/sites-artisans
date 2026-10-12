import { getSupabase, isSupabaseConfigured } from "~/lib/supabase";
import type { CommercialSubmitPayload, CommercialSubmitResult } from "./types";

export async function submitCommercialRequest(
  payload: CommercialSubmitPayload,
): Promise<CommercialSubmitResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error:
        "Enregistrement en ligne indisponible (Supabase non configuré). Votre configuration locale est conservée.",
      code: "migration_pending",
    };
  }
  const sb = getSupabase();
  if (!sb) {
    return {
      ok: false,
      error: "Client Supabase indisponible. Réessayez plus tard.",
      code: "migration_pending",
    };
  }

  const { data, error } = await sb.functions.invoke("submit-commercial-request", {
    body: payload,
  });

  if (error) {
    const msg = error.message || "Échec de l’envoi";
    const migration =
      msg.toLowerCase().includes("migration") || msg.toLowerCase().includes("503");
    return {
      ok: false,
      error: msg,
      code: migration ? "migration_pending" : "error",
    };
  }

  if (data?.error) {
    return {
      ok: false,
      error: String(data.error),
      code: data.code ? String(data.code) : undefined,
      status: typeof data.status === "number" ? data.status : undefined,
    };
  }

  if (!data?.ok || !data?.tracking_code) {
    return { ok: false, error: "Réponse serveur inattendue" };
  }

  return {
    ok: true,
    already_received: Boolean(data.already_received),
    tracking_code: String(data.tracking_code),
    request_id: String(data.request_id),
    prospect_id: String(data.prospect_id),
    configuration_id: String(data.configuration_id),
    server_creation_cents: Number(data.server_creation_cents ?? 0),
    server_recurring_cents: Number(data.server_recurring_cents ?? 0),
    pricing_complete: Boolean(data.pricing_complete),
    price_differs_from_client: Boolean(data.price_differs_from_client),
    tax: data.tax ?? {
      vatRateBps: null,
      creationHtCents: Number(data.server_creation_cents ?? 0),
      creationVatCents: null,
      creationTtcCents: null,
    },
    warnings: Array.isArray(data.warnings) ? data.warnings.map(String) : [],
  };
}
