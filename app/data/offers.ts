import type { OfferTier } from "~/data/types";

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
  priceFrom: string;
  setup: string;
  monthly: string;
  highlights: string[];
};

export const offerPlans: OfferPlan[] = [
  {
    tier: "essentiel",
    name: "Essentiel",
    tagline: "Une page claire pour être trouvé et contacté",
    priceFrom: "490 €",
    setup: "490 €",
    monthly: "29 € / mois",
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
    priceFrom: "890 €",
    setup: "890 €",
    monthly: "49 € / mois",
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
    priceFrom: "1 490 €",
    setup: "1 490 €",
    monthly: "79 € / mois",
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
  { label: "Nom de domaine", essentiel: "Inclus 1 an", avance: "Inclus 1 an", pro: "Inclus 1 an" },
  { label: "Hébergement & mises à jour techniques", essentiel: true, avance: true, pro: true },
  { label: "Espace client suivi de projet", essentiel: "Inclus", avance: "Inclus", pro: "Inclus" },
  { label: "Accompagnement rédaction", essentiel: "Textes de base", avance: "Textes complets", pro: "Textes + storytelling" },
];

export const tierLabels: Record<OfferTier, string> = {
  essentiel: "Essentiel",
  avance: "Avancé",
  pro: "Pro",
};
