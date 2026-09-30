import { buildTrade } from "./_build";

export const paysagiste = buildTrade({
  slug: "paysagiste",
  label: "Paysagiste",
  labelPlural: "Paysagistes",
  shortLabel: "Paysagiste",
  tagline: "Jardins durables et espaces verts sur mesure",
  specialty: "Conception, plantation et entretien",
  defaultFirstName: "Hélène",
  defaultLastName: "Rousseau",
  defaultCompany: "Rousseau Paysage",
  defaultCity: "Toulouse",
  palette: {
    ink: "#1b3d2f",
    paper: "#f6fbf7",
    muted: "#6b8f7a",
    accent: "#2d6a4f",
    accentSoft: "#d8f3dc",
    surface: "#e8f5e9",
  },
  about:
    "Paysagiste diplômée, je conçois des jardins adaptés au climat toulousain et à votre mode de vie. Je privilégie les plantes locales et l’économie d’eau. Entretien régulier ou création complète : chaque projet commence par une visite sur place.",
  services: [
    {
      title: "Création de jardin",
      description: "Plan masse, terrassement léger, plantation et arrosage automatique.",
      priceFrom: "85 €/m²",
    },
    {
      title: "Entretien mensuel",
      description: "Tonte, taille haies, désherbage massifs et contrôle arrosage.",
      priceFrom: "120 €/mois",
    },
    {
      title: "Terrasse et dallage",
      description: "Bois composite, pierre naturelle ou grès cérame sur plots ou dalle.",
      priceFrom: "95 €/m²",
    },
    {
      title: "Clôtures et portails",
      description: "Grillage rigide, claustras bois ou vegetal, portillon sur mesure.",
      priceFrom: "65 €/ml",
    },
    {
      title: "Arrosage automatique",
      description: "Programmation, goutte-à-goutte massifs et pelouse, sonde pluie.",
      priceFrom: "1 800 €",
    },
  ],
  projectTitles: [
    "Jardin méditerranéen",
    "Terrasse ombragée",
    "Haie brise-vue",
    "Massif fleuri printemps",
    "Potager surélevé",
    "Cour minérale et graminées",
  ],
  projectSummaries: [
    "Oliviers, lavandes et gravier stabilisé, arrosage localisé.",
    "Pergola bioclimatique, dalles grès et éclairage basse tension.",
    "Claustras bois et laurier cerise pour intimité vis-à-vis.",
    "Bulbes et vivaces pour floraison de mars à octobre.",
    "Bacs en Douglas, compost intégré, irrigation goutte-à-goutte.",
    "Pavés et plantes sèches, zéro entretien intensif.",
  ],
  projectTags: [
    ["création", "méditerranéen", "plantation"],
    ["terrasse", "pergola", "détente"],
    ["clôture", "intimité", "haie"],
    ["massif", "fleurs", "saison"],
    ["potager", "bio", "légumes"],
    ["minéral", "graminées", "contemporain"],
  ],
  testimonials: [
    {
      name: "Patrice N.",
      city: "Colomiers",
      text: "Notre jardin était invivable l’été : maintenant ombre, plantes résistantes et facture d’eau en baisse.",
    },
    {
      name: "Sandrine L.",
      city: "Toulouse",
      text: "Entretien mensuel depuis deux ans, jardin toujours propre sans que j’aie à m’en occuper.",
    },
    {
      name: "Michel E.",
      city: "Blagnac",
      text: "Terrasse et éclairage posés en trois semaines. Conseils plantes très utiles.",
    },
  ],
  faqs: [
    {
      question: "Proposez-vous des plans 3D ?",
      answer: "Un plan masse détaillé est inclus ; la vue 3D est disponible en option pour les projets de création.",
    },
    {
      question: "Entretenez-vous les pelouses synthétiques ?",
      answer: "Oui, nettoyage, brossage et désherbage des bordures pour garder un aspect naturel.",
    },
    {
      question: "Quelle période pour planter ?",
      answer: "Automne et début printemps sont idéaux ; l’été on privilégie l’arrosage renforcé ou la reportation.",
    },
    {
      question: "Travaillez-vous avec des matériaux recyclés ?",
      answer: "Lorsque c’est pertinent : graviers reconstitués, bois certifié PEFC, compost local pour les massifs.",
    },
  ],
  estimator: {
    label: "Estimation jardin",
    options: [
      { id: "entretien", label: "Entretien (petit jardin)", base: 110, unit: "€ / mois" },
      { id: "tonte", label: "Tonte pelouse", base: 45, unit: "€ / passage" },
      { id: "terrasse", label: "Terrasse bois", base: 90, unit: "€ / m²" },
    ],
  },
  hasBeforeAfter: true,
});
