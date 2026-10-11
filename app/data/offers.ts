import type { OfferTier } from "~/data/types";
import { formatEuro } from "~/lib/format";

/**
 * Passer à `true` lorsque le configurateur tarifaire est opérationnel.
 * Active la formulation définitive sur l’accueil (tarif immédiat).
 */
export const PRICING_CONFIGURATOR_LIVE = false;

export const HOME_VALUE_PROP = {
  interim:
    "Choisissez votre métier, personnalisez votre futur site et découvrez nos offres en toute transparence.",
  final:
    "Choisissez votre métier, personnalisez votre site et découvrez immédiatement votre tarif. Sans mauvaise surprise.",
} as const;

export function homeValuePropLine(): string {
  return PRICING_CONFIGURATOR_LIVE ? HOME_VALUE_PROP.final : HOME_VALUE_PROP.interim;
}

export type OfferFeature = {
  label: string;
  essentiel: boolean | string;
  avance: boolean | string;
  pro: boolean | string;
};

export type OfferPlan = {
  tier: OfferTier;
  name: string;
  tagline: string;
  /** Prix de création de référence (euros). Susceptible d’ajustement. */
  setupPrice: number;
  highlights: string[];
};

/** Libellé d’affichage du prix de création (ex. « 490 € »). */
export function formatSetupPrice(amount: number): string {
  return formatEuro(amount);
}

/**
 * Notes commerciales partagées — création vs frais tiers vs maintenance.
 * Ne pas présenter la maintenance comme un abonnement obligatoire.
 */
export const commercialNotes = {
  setupOnly: "Prix de création de référence — devis détaillé après échange.",
  hosting:
    "Hébergement et nom de domaine : à votre charge auprès d’OVH ou d’un autre fournisseur. Non inclus dans le prix de création.",
  maintenance:
    "Maintenance facultative, distincte de l’hébergement — proposée selon vos besoins, jamais imposée.",
  thirdParty:
    "Les outils métier externes (agenda, paiement, etc.) restent à votre charge auprès de leurs éditeurs.",
} as const;

export const offerPlans: OfferPlan[] = [
  {
    tier: "essentiel",
    name: "Essentiel",
    tagline: "Une page claire pour être trouvé et contacté",
    setupPrice: 490,
    highlights: [
      "Une page unique soignée",
      "Coordonnées et formulaire de contact",
      "Présentation de vos services",
      "Quelques réalisations",
      "Adapté mobile",
    ],
  },
  {
    tier: "avance",
    name: "Avancé",
    tagline: "Un site multipage pour présenter votre savoir-faire",
    setupPrice: 790,
    highlights: [
      "Plusieurs pages (accueil, services, réalisations…)",
      "Filtrage des projets par type",
      "Demande de devis guidée",
      "Zone d’intervention visible",
      "Mises à jour simples via votre espace (bientôt)",
    ],
  },
  {
    tier: "pro",
    name: "Pro",
    tagline: "Une vitrine premium avec outils pour vos clients",
    setupPrice: 1190,
    highlights: [
      "Design immersif et pages détaillées",
      "Fiches projet avec photos avant / après",
      "Estimateur indicatif en ligne",
      "Formulaire pour demander un rendez-vous",
      "Accompagnement contenu au lancement",
    ],
  },
];

export const comparisonFeatures: OfferFeature[] = [
  { label: "Nombre de pages", essentiel: "1 page", avance: "5 pages environ", pro: "8 pages et plus" },
  { label: "Design & direction artistique", essentiel: "Sobre et clair", avance: "Éditorial soigné", pro: "Sur-mesure immersif" },
  { label: "Présentation des services", essentiel: "Liste simple", avance: "Pages détaillées", pro: "Pages + mise en avant" },
  { label: "Galerie / réalisations", essentiel: "3 projets", avance: "Galerie filtrable", pro: "Fiches projet détaillées" },
  { label: "Photos avant / après", essentiel: false, avance: false, pro: true },
  { label: "Formulaire de contact", essentiel: true, avance: true, pro: true },
  { label: "Bouton d’appel sur mobile", essentiel: true, avance: true, pro: true },
  { label: "Demande de devis", essentiel: false, avance: "Formulaire guidé", pro: "Guidé + estimateur" },
  { label: "Estimateur en ligne", essentiel: false, avance: false, pro: true },
  { label: "Prise de rendez-vous", essentiel: false, avance: false, pro: "Formulaire dédié" },
  { label: "Zone d’intervention", essentiel: "Mention", avance: "Mise en avant", pro: "Mise en avant" },
  { label: "Avis clients", essentiel: true, avance: true, pro: true },
  { label: "Optimisation mobile", essentiel: true, avance: true, pro: true },
  { label: "Bases du référencement local", essentiel: true, avance: "Renforcé", pro: "Renforcé" },
  {
    label: "Nom de domaine",
    essentiel: "À votre charge",
    avance: "À votre charge",
    pro: "À votre charge",
  },
  {
    label: "Hébergement",
    essentiel: "À votre charge",
    avance: "À votre charge",
    pro: "À votre charge",
  },
  {
    label: "Maintenance",
    essentiel: "Facultative",
    avance: "Facultative",
    pro: "Facultative",
  },
  { label: "Espace client suivi de projet", essentiel: "Inclus", avance: "Inclus", pro: "Inclus" },
  { label: "Accompagnement rédaction", essentiel: "Textes de base", avance: "Textes complets", pro: "Textes + storytelling" },
];

export const tierLabels: Record<OfferTier, string> = {
  essentiel: "Essentiel",
  avance: "Avancé",
  pro: "Pro",
};
