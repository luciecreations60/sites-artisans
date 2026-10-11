/**
 * Miroir TypeScript de public.enforce_site_production_job (validation devis).
 * Ne remplace pas le trigger SQL — sert de garde-fou client + tests locaux.
 */

export type QuoteGuardInput = {
  isTestFixture: boolean;
  projectId: string | null;
  configurationId: string | null;
  acceptedQuoteId: string | null;
  configurationProjectId?: string | null;
  quote?: {
    id: string;
    kind: string;
    status: string;
    locked: boolean;
    project_id: string | null;
    configuration_id: string | null;
  } | null;
};

export type QuoteGuardResult =
  | { ok: true }
  | { ok: false; reason: string };

/** Devis réellement éligible à une production client (pas une simulation / sent). */
export function isAcceptedLockedIssuedQuote(quote: {
  kind: string;
  status: string;
  locked: boolean;
}): boolean {
  return quote.kind === "issued" && quote.status === "accepted" && quote.locked === true;
}

export function assertProductionJobQuote(input: QuoteGuardInput): QuoteGuardResult {
  if (input.isTestFixture) {
    if (input.projectId || input.configurationId || input.acceptedQuoteId) {
      return {
        ok: false,
        reason: "Fixture TEST — project_id, configuration_id et accepted_quote_id doivent rester vides",
      };
    }
    return { ok: true };
  }

  if (!input.projectId) {
    return { ok: false, reason: "Production réelle — projet obligatoire" };
  }
  if (!input.configurationId) {
    return { ok: false, reason: "Production réelle — configuration obligatoire" };
  }
  if (!input.acceptedQuoteId) {
    return { ok: false, reason: "Production réelle — devis accepté obligatoire" };
  }

  if (
    input.configurationProjectId != null &&
    input.configurationProjectId !== input.projectId
  ) {
    return { ok: false, reason: "Configuration liée à un autre projet" };
  }

  const quote = input.quote;
  if (!quote) {
    return { ok: false, reason: "Devis introuvable ou non fourni par le serveur" };
  }
  if (quote.id !== input.acceptedQuoteId) {
    return { ok: false, reason: "Identifiant devis incohérent" };
  }
  if (!isAcceptedLockedIssuedQuote(quote)) {
    return {
      ok: false,
      reason:
        "Devis non éligible — requis : kind=issued, status=accepted, locked=true",
    };
  }
  if (quote.project_id !== input.projectId) {
    return { ok: false, reason: "Devis appartenant à un autre projet" };
  }
  if (
    quote.configuration_id != null &&
    quote.configuration_id !== input.configurationId
  ) {
    return { ok: false, reason: "Devis lié à une autre configuration" };
  }

  return { ok: true };
}
