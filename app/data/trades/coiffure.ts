import { buildTrade } from "./_build";

export const coiffure = buildTrade({
  slug: "coiffure",
  label: "Coiffeur / Barbier",
  labelPlural: "Coiffeurs",
  shortLabel: "Coiffure",
  tagline: "Coupe, couleur et barbier sur rendez-vous",
  specialty: "Salon de quartier, femmes et hommes",
  defaultFirstName: "Samir",
  defaultLastName: "Aït",
  defaultCompany: "Salon Aït Coiffure",
  defaultCity: "Marseille",
  palette: {
    ink: "#212121",
    paper: "#fdf8f6",
    muted: "#9e8e88",
    accent: "#c2185b",
    accentSoft: "#fce4ec",
    surface: "#f5ebe8",
  },
  about:
    "Coiffeur-barbier, j’accueille hommes, femmes et enfants dans un salon calme du centre-ville. Je prends le temps du conseil couleur et de la coupe adaptée à votre visage. Produits professionnels sans surcharge de marque inutile.",
  services: [
    {
      title: "Coupe femme",
      description: "Shampooing, coupe, brushing ou séchage naturel au choix.",
      priceFrom: "38 €",
    },
    {
      title: "Coupe homme et barbe",
      description: "Taille aux ciseaux ou tondeuse, contours et barbe structurée.",
      priceFrom: "22 €",
    },
    {
      title: "Couleur et mèches",
      description: "Couleur racines, balayage ou patine, soin inclus en fin de prestation.",
      priceFrom: "55 €",
    },
    {
      title: "Coiffure événement",
      description: "Chignon, brushing volume pour mariage ou soirée.",
      priceFrom: "65 €",
    },
    {
      title: "Forfait enfant",
      description: "Coupe jusqu’à 12 ans, ambiance patiente et ludique.",
      priceFrom: "16 €",
    },
  ],
  projectTitles: [
    "Balayage naturel",
    "Dégradé barbe sculptée",
    "Coupe pixie structurée",
    "Chignon mariage",
    "Coloration végétale",
    "Transformation coupe longue",
  ],
  projectSummaries: [
    "Éclaircissement progressif sans démarcation, patine cendrée.",
    "Dégradé bas, barbe taillée au rasoir et huile apaisante.",
    "Volume sur cheveux fins, texturisation ciseaux.",
    "Chignon bas fleuri, essai inclus une semaine avant.",
    "Teintes plantes sur cheveux sensibilisés, test mèche préalable.",
    "Coupe longueur épaules avec frange rideau, conseil entretien maison.",
  ],
  projectTags: [
    ["couleur", "balayage", "femme"],
    ["barbe", "homme", "barbier"],
    ["coupe", "court", "tendance"],
    ["mariage", "chignon", "événement"],
    ["naturel", "soin", "couleur"],
    ["transformation", "conseil", "salon"],
  ],
  testimonials: [
    {
      name: "Yasmine B.",
      city: "Marseille 6e",
      text: "Samir écoute vraiment ce qu’on veut. Mon balayage tient bien entre deux visites.",
    },
    {
      name: "Olivier P.",
      city: "Marseille",
      text: "Meilleur dégradé du quartier, pas d’attente interminable avec le rendez-vous.",
    },
    {
      name: "Léa F.",
      city: "Aix-en-Provence",
      text: "Chignon de mariage tenu toute la nuit, essai rassurant la semaine d’avant.",
    },
  ],
  faqs: [
    {
      question: "Faut-il réserver ?",
      answer: "Oui, par téléphone ou en ligne. Quelques créneaux sans RDV le mardi matin pour hommes.",
    },
    {
      question: "Acceptez-vous les cartes titre ?",
      answer: "Nous acceptons les titres restaurant sur la partie snacking si vous prenez un café ou un soin retail.",
    },
    {
      question: "Faites-vous les extensions ?",
      answer: "Pose à froid et retouches sur devis après diagnostic de vos cheveux naturels.",
    },
    {
      question: "Quels produits utilisez-vous ?",
      answer: "Gammes professionnelles sans parabènes pour la couleur, shampoings doux pour usage fréquent.",
    },
  ],
  estimator: {
    label: "Estimation coiffure",
    options: [
      { id: "homme", label: "Coupe homme", base: 22, unit: "€" },
      { id: "femme", label: "Coupe femme", base: 38, unit: "€" },
      { id: "couleur", label: "Couleur racines", base: 52, unit: "€" },
    ],
  },
});
