import type { ProductionEligibility, ProductionJob } from "./types.ts";

/**
 * Un site client réel ne peut être généré pour livraison que si
 * projet + config + devis accepté + lancement explicite.
 * Les fixtures TEST passent en mode test uniquement.
 */
export function evaluateProductionEligibility(
  job: Pick<
    ProductionJob,
    | "projectId"
    | "configurationId"
    | "config"
    | "isTestFixture"
    | "backendAvailable"
    | "content"
  >,
  opts?: { quoteAccepted?: boolean; quoteKind?: string },
): ProductionEligibility {
  if (job.isTestFixture || job.content.isTestFixture) {
    return { ok: true, mode: "test_fixture" };
  }

  const reasons: string[] = [];

  if (!job.projectId?.trim()) {
    reasons.push("Projet manquant");
  }
  if (!job.configurationId?.trim()) {
    reasons.push("Configuration liée au projet manquante");
  }
  if (!opts?.quoteAccepted) {
    reasons.push("Devis non accepté — une simulation n’est pas une commande");
  }
  if (opts?.quoteKind === "simulation") {
    reasons.push("Simulation commerciale — production livrable interdite");
  }
  if (!job.config.acceptedQuoteReference?.trim()) {
    reasons.push("Référence de devis accepté absente");
  }
  if (!job.config.companyName?.trim()) {
    reasons.push("Nom d’entreprise manquant");
  }
  if (!job.config.tradeSlug || !job.config.planId) {
    reasons.push("Métier ou formule manquant");
  }
  if (!job.backendAvailable) {
    reasons.push(
      "Backend commercial (lot 5) non opérationnel — génération livrable désactivée",
    );
  }

  if (reasons.length) return { ok: false, reasons };
  return { ok: true, mode: "live" };
}

/** Interdit de présenter un succès si la génération n’a pas réellement produit de sortie. */
export function assertHonestGenerationResult(opts: {
  attempted: boolean;
  outputExists: boolean;
  errorMessage: string | null;
}): { success: boolean; message: string } {
  if (!opts.attempted) {
    return { success: false, message: "Génération non lancée" };
  }
  if (opts.errorMessage) {
    return { success: false, message: opts.errorMessage };
  }
  if (!opts.outputExists) {
    return {
      success: false,
      message: "Aucun dossier généré — échec sans faux succès",
    };
  }
  return { success: true, message: "Site généré localement" };
}
