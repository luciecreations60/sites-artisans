/** Grille d’analyse fixe (pas un référentiel DB) — source unique des labels. */
export const ANALYSIS_FLAGS = [
  { code: "no_website", label: "Aucun site internet" },
  { code: "outdated_website", label: "Site ancien" },
  { code: "outdated_design", label: "Design vieillissant" },
  { code: "poor_mobile", label: "Mauvaise expérience mobile" },
  { code: "slow_website", label: "Site lent" },
  { code: "unclear_navigation", label: "Navigation peu claire" },
  { code: "hard_to_find_information", label: "Informations difficiles à trouver" },
  { code: "contact_not_visible", label: "Coordonnées peu visibles" },
  { code: "no_contact_form", label: "Pas de formulaire de contact" },
  { code: "no_quote_request", label: "Pas de demande de devis" },
  { code: "poor_services_presentation", label: "Prestations mal présentées" },
  { code: "poor_portfolio", label: "Réalisations peu mises en valeur" },
  { code: "poor_photos", label: "Photos insuffisantes / peu professionnelles" },
  { code: "weak_local_seo", label: "Référencement local à améliorer" },
  { code: "google_profile_to_improve", label: "Fiche Google à améliorer" },
  { code: "weak_social_presence", label: "Présence réseaux sociaux limitée" },
  { code: "other", label: "Autre" },
] as const;

export type AnalysisFlagCode = (typeof ANALYSIS_FLAGS)[number]["code"];

export function analysisFlagLabel(code: string): string {
  return ANALYSIS_FLAGS.find((f) => f.code === code)?.label ?? code;
}
