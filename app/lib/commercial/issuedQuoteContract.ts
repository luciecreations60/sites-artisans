/**
 * Miroir de public.assert_issued_quote_contract (SQL) — tests unitaires.
 */
export type IssuedQuoteContractInput = {
  kind: string;
  locked: boolean;
  reference: string | null;
  issuedAt: string | null;
  pricingComplete: boolean;
  taxRegime: string;
  vatRateBps: number | null;
  issuerSnapshot: {
    legal_name?: string | null;
    address_line?: string | null;
    city?: string | null;
    vat_number?: string | null;
  } | null;
};

export function assertIssuedQuoteContract(
  row: IssuedQuoteContractInput,
): { ok: true } | { ok: false; reason: string } {
  if (row.kind !== "issued") return { ok: true };
  if (!row.locked) return { ok: false, reason: "verrouillage obligatoire" };
  if (!row.reference?.trim()) return { ok: false, reason: "référence obligatoire" };
  if (!row.issuedAt) return { ok: false, reason: "date d’émission obligatoire" };
  if (!row.pricingComplete) return { ok: false, reason: "chiffrage incomplet" };
  if (row.taxRegime === "unknown") return { ok: false, reason: "régime fiscal manquant" };
  const issuer = row.issuerSnapshot;
  if (!issuer?.legal_name?.trim() || !issuer.address_line?.trim() || !issuer.city?.trim()) {
    return { ok: false, reason: "informations légales émetteur incomplètes" };
  }
  if (row.taxRegime === "liable" && (row.vatRateBps == null || !issuer.vat_number?.trim())) {
    return { ok: false, reason: "TVA assujettie incomplète" };
  }
  return { ok: true };
}
