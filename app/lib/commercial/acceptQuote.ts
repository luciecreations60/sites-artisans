/**
 * Logique pure d’acceptation d’un devis émis + lien config → projet.
 * Le project_id du devis émis est immuable : on lie via site_configurations.
 */

export type AcceptQuoteLinkDecision =
  | { action: "link"; projectId: string; configurationId: string }
  | { action: "already_linked"; projectId: string; configurationId: string }
  | { action: "needs_conversion"; reason: string }
  | { action: "no_configuration"; reason: string };

export function decideAcceptQuoteProjectLink(input: {
  configurationId: string | null;
  prospectId: string | null;
  /** Projet CRM déjà lié à ce prospect (conversion). */
  projectIdForProspect: string | null;
  /** project_id déjà posé sur la configuration. */
  configurationProjectId: string | null;
}): AcceptQuoteLinkDecision {
  if (!input.configurationId) {
    return {
      action: "no_configuration",
      reason: "Aucune configuration liée à ce devis — lien projet impossible.",
    };
  }
  if (input.configurationProjectId) {
    return {
      action: "already_linked",
      projectId: input.configurationProjectId,
      configurationId: input.configurationId,
    };
  }
  if (!input.projectIdForProspect) {
    return {
      action: "needs_conversion",
      reason:
        "Devis accepté. Convertissez le prospect en client pour créer le projet CRM et lier la configuration.",
    };
  }
  return {
    action: "link",
    projectId: input.projectIdForProspect,
    configurationId: input.configurationId,
  };
}

const STATUS_LABELS: Record<string, string> = {
  accepted: "accepté",
  refused: "refusé",
  cancelled: "annulé",
  superseded: "remplacé",
  sent: "envoyé",
  open: "ouvert",
};

export function quoteStatusLabelFr(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
