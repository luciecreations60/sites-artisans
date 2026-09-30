import { buildTrade } from "./_build";

export const garage = buildTrade({
  slug: "garage",
  label: "Garage / Mécanicien",
  labelPlural: "Garages",
  shortLabel: "Garage",
  tagline: "Entretien et réparation automobile",
  specialty: "Mécanique générale, freinage et diagnostic",
  defaultFirstName: "Nicolas",
  defaultLastName: "Petit",
  defaultCompany: "Garage Petit Auto",
  defaultCity: "Strasbourg",
  palette: {
    ink: "#0d0d0d",
    paper: "#ececec",
    muted: "#5c5c5c",
    accent: "#d62828",
    accentSoft: "#ffc9c9",
    surface: "#d9d9d9",
  },
  about:
    "Garage indépendant toutes marques, je réalise entretiens, freinage, distribution et diagnostic électronique. Les pièces sont proposées en origine ou équivalent qualité selon votre budget. Devis gratuit avant toute réparation hors révision programmée.",
  services: [
    {
      title: "Révision et vidange",
      description: "Opérations constructeur respectées, filtres et liquides adaptés au véhicule.",
      priceFrom: "149 €",
    },
    {
      title: "Freinage",
      description: "Disques, plaquettes, liquide de frein et contrôle étriers.",
      priceFrom: "220 €",
    },
    {
      title: "Distribution et embrayage",
      description: "Kit courroie ou chaîne, pompe à eau si recommandé, réglage embrayage.",
      priceFrom: "650 €",
    },
    {
      title: "Diagnostic électronique",
      description: "Lecture défauts, effacement voyants, rapport détaillé au client.",
      priceFrom: "55 €",
    },
    {
      title: "Pneumatiques",
      description: "Montage, équilibrage, permutation saisonnière et contrôle géométrie.",
      priceFrom: "18 €",
    },
  ],
  projectTitles: [
    "Révision complète citadine",
    "Freins avant SUV",
    "Distribution diesel",
    "Climatisation rechargée",
    "Préparation contrôle technique",
    "Embrayage utilitaire",
  ],
  projectSummaries: [
    "Vidange longue durée, filtres air et habitacle, niveaux vérifiés.",
    "Disques ventilés et plaquettes céramique, essai route.",
    "Courroie, galets et pompe à eau, vidange liquide refroidissement.",
    "Test étanchéité circuit, recharge gaz R1234yf conforme.",
    "Corrections niveaux, éclairage, freinage et pollution avant passage.",
    "Kit embrayage et volant moteur bi-masse sur fourgon.",
  ],
  projectTags: [
    ["entretien", "vidange", "révision"],
    ["freinage", "sécurité", "disques"],
    ["distribution", "moteur", "courroie"],
    ["climatisation", "confort", "recharge"],
    ["contrôle technique", "préparation", "diagnostic"],
    ["embrayage", "utilitaire", "réparation"],
  ],
  testimonials: [
    {
      name: "Luc M.",
      city: "Schiltigheim",
      text: "Devis clair pour la distribution, voiture rendue le jour promis. Pas de mauvaise surprise.",
    },
    {
      name: "Aurélie T.",
      city: "Strasbourg",
      text: "Garage de quartier sérieux : ils m’expliquent ce qui est urgent ou peut attendre.",
    },
    {
      name: "Henri K.",
      city: "Illkirch",
      text: "CT passé du premier coup après leur préparation. Tarifs corrects pour le pneu.",
    },
  ],
  faqs: [
    {
      question: "Acceptez-vous les véhicules de société ?",
      answer: "Oui, facturation avec TVA et bon de commande, créneaux matin pour limiter l’immobilisation.",
    },
    {
      question: "Proposez-vous un véhicule de courtoisie ?",
      answer: "Un prêt simple est possible sur demande selon disponibilité, sans frais pour révisions longues.",
    },
    {
      question: "Les pièces sont-elles garanties ?",
      answer: "Garantie constructeur ou fournisseur sur les pièces, main d’œuvre garantie six mois sur la réparation.",
    },
    {
      question: "Puis-je apporter mes propres pneus ?",
      answer: "Oui, montage et équilibrage facturés au tarif affiché, sous réserve de dimensions compatibles.",
    },
  ],
  estimator: {
    label: "Estimation entretien",
    options: [
      { id: "vidange", label: "Vidange standard", base: 129, unit: "€" },
      { id: "pneu", label: "Montage pneu", base: 16, unit: "€ / roue" },
      { id: "diag", label: "Diagnostic", base: 50, unit: "€" },
    ],
  },
  hasBeforeAfter: true,
});
