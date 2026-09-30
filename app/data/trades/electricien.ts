import { buildTrade } from "./_build";

export const electricien = buildTrade({
  slug: "electricien",
  label: "Électricien",
  labelPlural: "Électriciens",
  shortLabel: "Électricien",
  tagline: "Installations électriques aux normes NF C 15-100",
  specialty: "Rénovation, domotique et mise en sécurité",
  defaultFirstName: "Thomas",
  defaultLastName: "Lefèvre",
  defaultCompany: "Lefèvre Électricité",
  defaultCity: "Nantes",
  palette: {
    ink: "#1a1a1a",
    paper: "#fafaf8",
    muted: "#6b6b6b",
    accent: "#f5c518",
    accentSoft: "#fef3c7",
    surface: "#f0f0ec",
  },
  about:
    "Électricien qualifié, je réalise des mises aux normes, des rénovations complètes et des installations domotiques légères. Chaque chantier est précédé d’un schéma et d’un devis détaillé. Je remets un consuel ou une attestation de conformité lorsque c’est requis.",
  services: [
    {
      title: "Mise aux normes tableau électrique",
      description: "Remplacement disjoncteurs, différentiels 30 mA, étiquetage et test de l’installation.",
      priceFrom: "650 €",
    },
    {
      title: "Rénovation électrique maison",
      description: "Repiquage complet, prises, éclairages et circuits dédiés cuisine et salle de bain.",
      priceFrom: "4 500 €",
    },
    {
      title: "Bornes de recharge véhicule",
      description: "Étude de puissance, pose murale ou sur pied, raccordement au tableau.",
      priceFrom: "890 €",
    },
    {
      title: "Éclairage intérieur et extérieur",
      description: "Spots LED, bandeaux, détecteurs et éclairage de façade.",
      priceFrom: "120 €",
    },
    {
      title: "Domotique et volets connectés",
      description: "Programmation volets, thermostats et interrupteurs connectés compatibles Alexa ou Google.",
      priceFrom: "350 €",
    },
  ],
  projectTitles: [
    "Tableau neuf maison ancienne",
    "Cuisine tout-électrique",
    "Borne recharge garage",
    "Éclairage jardin LED",
    "Appartement rénové T3",
    "Alarme et vidéosurveillance",
  ],
  projectSummaries: [
    "Remplacement tableau vétuste, terre et liaisons équipotentielles refaites.",
    "Four, plaques, lave-vaisselle : circuits dédiés et prises plan de travail.",
    "Wallbox 7,4 kW avec disjoncteur adapté et passage consuel.",
    "Projecteurs encastrés allée et terrasse, minuterie crépusculaire.",
    "Réfection complète gaines et appareillage design dans les pièces de vie.",
    "Centrale filaire, détecteurs ouverture et deux caméras IP.",
  ],
  projectTags: [
    ["tableau", "normes", "sécurité"],
    ["cuisine", "puissance", "rénovation"],
    ["VE", "borne", "recharge"],
    ["extérieur", "LED", "jardin"],
    ["appartement", "rénovation", "NF C 15-100"],
    ["alarme", "domotique", "sécurité"],
  ],
  testimonials: [
    {
      name: "Isabelle G.",
      city: "Rezé",
      text: "Mise aux normes faite en deux jours, explications claires sur ce qui était dangereux avant.",
    },
    {
      name: "David H.",
      city: "Saint-Herblain",
      text: "Borne installée proprement, démarches consuel gérées. Très professionnel.",
    },
    {
      name: "Anne C.",
      city: "Nantes",
      text: "Rénovation électrique de notre maison des années 70 : plus de disjonctions, tout est carré.",
    },
  ],
  faqs: [
    {
      question: "Fournissez-vous l’attestation Consuel ?",
      answer: "Oui pour les installations neuves ou les modifications importantes nécessitant un contrôle.",
    },
    {
      question: "Puis-je garder une partie de l’ancienne installation ?",
      answer: "Seulement si elle reste conforme après diagnostic. Sinon je vous indique les minimums obligatoires.",
    },
    {
      question: "Intervenez-vous pour un simple dépannage ?",
      answer: "Oui, recherche de panne, remplacement prise ou disjoncteur, sur rendez-vous ou urgence selon dispo.",
    },
    {
      question: "Quels délais pour une rénovation complète ?",
      answer: "En général une à trois semaines selon la surface et l’accessibilité des combles ou sous-sols.",
    },
  ],
  estimator: {
    label: "Estimation électrique",
    options: [
      { id: "prise", label: "Ajout prise", base: 85, unit: "€ / point" },
      { id: "spot", label: "Spot LED encastré", base: 65, unit: "€ / unité" },
      { id: "tableau", label: "Mise à niveau tableau", base: 550, unit: "€" },
    ],
  },
});
