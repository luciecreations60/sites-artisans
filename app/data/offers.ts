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
    tagline: "Un mini-site pour rassurer et convertir",
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
    tagline: "Image premium et outils pour les chantiers exigeants",
    priceFrom: "1 490 €",
    setup: "1 490 €",
    monthly: "79 € / mois",
    highlights: [
      "Design immersif et pages détaillées",
      "Fiches projet avec photos avant / après",
      "Estimateur indicatif en ligne",
      "Prise de rendez-vous type contact enrichi",
      "Accompagnement contenu au lancement",
    ],
  },
];

export const comparisonFeatures: OfferFeature[] = [
  { label: "Pages", essentiel: "1", avance: "5+", pro: "8+" },
  { label: "Formulaire contact", essentiel: true, avance: true, pro: true },
  { label: "Liste des services", essentiel: true, avance: true, pro: true },
  { label: "Galerie réalisations", essentiel: "3 projets", avance: "Filtrable", pro: "Fiches détaillées" },
  { label: "Devis en ligne", essentiel: false, avance: "Guidé", pro: "Guidé + estimateur" },
  { label: "Avant / après", essentiel: false, avance: false, pro: true },
  { label: "Espace client", essentiel: "Bientôt", avance: "Bientôt", pro: "Bientôt" },
  { label: "Nom de domaine", essentiel: "Inclus 1 an", avance: "Inclus 1 an", pro: "Inclus 1 an" },
  { label: "Hébergement", essentiel: true, avance: true, pro: true },
];

export const tierLabels: Record<OfferTier, string> = {
  essentiel: "Essentiel",
  avance: "Avancé",
  pro: "Pro",
};
