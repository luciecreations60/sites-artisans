/**
 * Transitions de statut commercial des devis.
 * Doit rester aligné avec public.quote_status_transition_allowed (SQL).
 */
export type QuoteCommercialStatus =
  | "open"
  | "sent"
  | "accepted"
  | "refused"
  | "cancelled"
  | "superseded";

const ALLOWED: Record<QuoteCommercialStatus, QuoteCommercialStatus[]> = {
  open: ["sent", "cancelled"],
  sent: ["accepted", "refused", "cancelled", "superseded"],
  accepted: ["cancelled", "superseded"],
  refused: ["superseded"],
  cancelled: ["superseded"],
  superseded: [],
};

export function quoteStatusTransitionAllowed(
  from: string,
  to: string,
): boolean {
  if (from === to) return true;
  const next = ALLOWED[from as QuoteCommercialStatus];
  if (!next) return false;
  return next.includes(to as QuoteCommercialStatus);
}

/** Champs contractuels immuables une fois le devis émis/verrouillé. */
export const QUOTE_IMMUTABLE_FIELDS = [
  "reference",
  "kind",
  "project_id",
  "configuration_id",
  "commercial_request_id",
  "trade_slug",
  "plan_id",
  "currency",
  "creation_ht_cents",
  "creation_vat_cents",
  "creation_ttc_cents",
  "recurring_cents",
  "tax_regime",
  "vat_rate_bps",
  "pricing_complete",
  "catalog_fingerprint",
  "lines_snapshot",
  "pricing_snapshot",
  "issuer_snapshot",
  "client_snapshot",
  "notes",
  "valid_until",
  "issued_at",
  "issued_by",
  "locked",
] as const;

export type QuoteLockMutation = {
  locked: boolean;
  kind: string;
  status: string;
  /** Tentative de déverrouillage */
  unlock?: boolean;
  /** Champs contractuels modifiés */
  contractualChanged?: boolean;
  /** prospect_id passé à null (RGPD) */
  unlinkProspect?: boolean;
  /** prospect_id réassigné vers un autre uuid */
  reassignProspect?: boolean;
};

/**
 * Règles applicatives (miroir du trigger SQL) pour tests unitaires.
 */
export function evaluateQuoteLockMutation(
  before: { locked: boolean; kind: string; status: string },
  mutation: QuoteLockMutation,
): { ok: boolean; reason?: string } {
  const wasLocked = before.locked || before.kind === "issued";
  const issuing = mutation.kind === "issued" && before.kind !== "issued";

  if (mutation.unlock || (wasLocked && mutation.locked === false)) {
    return { ok: false, reason: "Déverrouillage interdit" };
  }
  if (before.kind === "issued" && mutation.kind !== "issued") {
    return { ok: false, reason: "Rétrogradation de type interdite" };
  }
  if (wasLocked && !issuing) {
    if (mutation.reassignProspect) {
      return { ok: false, reason: "Réaffectation de prospect interdite" };
    }
    if (mutation.contractualChanged) {
      return { ok: false, reason: "Champs contractuels immuables" };
    }
    if (mutation.status !== before.status) {
      if (!quoteStatusTransitionAllowed(before.status, mutation.status)) {
        return { ok: false, reason: `Transition interdite ${before.status} → ${mutation.status}` };
      }
    }
    return { ok: true };
  }
  if (mutation.status !== before.status) {
    if (
      issuing &&
      before.status === "open" &&
      mutation.status === "sent"
    ) {
      return { ok: true };
    }
    if (!quoteStatusTransitionAllowed(before.status, mutation.status)) {
      return { ok: false, reason: `Transition interdite ${before.status} → ${mutation.status}` };
    }
  }
  return { ok: true };
}

export function issuedImpliesLocked(kind: string, locked: boolean): boolean {
  return kind !== "issued" || locked === true;
}
