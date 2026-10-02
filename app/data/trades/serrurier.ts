import { buildTrade } from "./_build";

export const serrurier = buildTrade({
  slug: "serrurier",
  label: "Serrurier",
  labelPlural: "Serruriers",
  shortLabel: "Serrurier",
  tagline: "Ouverture, sécurisation et double de clés",
  specialty: "Dépannage, cylindres et portes blindées",
  defaultFirstName: "Youssef",
  defaultLastName: "Haddad",
  defaultCompany: "Haddad Serrurerie",
  defaultCity: "Rouen",
  palette: {
    ink: "#111827",
    paper: "#f3f4f6",
    muted: "#6b7280",
    accent: "#374151",
    accentSoft: "#e5e7eb",
    surface: "#e5e7eb",
  },
  about:
    "Serrurier dépannage et sécurisation, j’interviens pour ouvertures de porte, changements de cylindre et renforcements. Devis clair avant intervention, pièces certifiées A2P quand c’est pertinent. Disponibilité urgente selon créneaux affichés.",
  services: [
    {
      title: "Ouverture de porte",
      description: "Porte claquée ou clé cassée : ouverture sans destruction lorsque c’est possible.",
      priceFrom: "89 €",
    },
    {
      title: "Changement de cylindre",
      description: "Pose de cylindre européen, haute sécurité ou sur mesure, avec clés remises en main propre.",
      priceFrom: "120 €",
    },
    {
      title: "Double de clés",
      description: "Reproduction de clés plates, multipoints et badges selon compatible.",
      priceFrom: "12 €",
    },
    {
      title: "Serrure multipoints",
      description: "Remplacement ou réglage de serrure 3 / 5 points, paumelles et gâches.",
      priceFrom: "280 €",
    },
    {
      title: "Blindage et sécurisation",
      description: "Renfort de porte, cornières anti-pinces et conseil assurance habitation.",
      priceFrom: "650 €",
    },
  ],
  projectTitles: [
    "Ouverture porte claquée",
    "Cylindre haute sécurité",
    "Doubles de clés famille",
    "Serrure 5 points neuve",
    "Porte d’entrée renforcée",
    "Dépannage clé cassée",
  ],
  projectSummaries: [
    "Ouverture sans perçage, réglage de la serrure et conseils d’usage.",
    "Cylindre A2P*, 5 clés remises, anciennes clés invalidées.",
    "Série de doubles pour parents et nounou, étiquetage clair.",
    "Remplacement serrure usée, alignement et essais complets.",
    "Cornières et renforts, cylindre sécurisé, attestation pour assurance.",
    "Extraction de clé cassée et cylindre remplacé le jour même.",
  ],
  projectTags: [
    ["urgence", "ouverture", "porte"],
    ["cylindre", "sécurité", "A2P"],
    ["clés", "doubles", "reproduction"],
    ["multipoints", "serrure", "entrée"],
    ["blindage", "renfort", "assurance"],
    ["dépannage", "clé cassée", "urgence"],
  ],
  testimonials: [
    {
      name: "Patricia L.",
      city: "Rouen",
      text: "Porte claquée un dimanche : intervention rapide et prix annoncé à l’avance.",
    },
    {
      name: "Marc T.",
      city: "Sotteville",
      text: "Cylindre changé proprement, explications claires pour l’assurance.",
    },
    {
      name: "Inès B.",
      city: "Rouen",
      text: "Doubles de clés faits en 20 minutes. Service simple et efficace.",
    },
  ],
  faqs: [
    {
      question: "Cassez-vous toujours la porte ?",
      answer: "Non. J’ouvre sans destruction dès que le type de serrure le permet. Sinon je vous préviens avant.",
    },
    {
      question: "Intervenez-vous la nuit ?",
      answer: "Oui sur créneaux d’urgence, avec majoration affichée avant le déplacement.",
    },
    {
      question: "Les cylindres sont-ils certifiés ?",
      answer: "Je propose des cylindres A2P* selon votre besoin et les exigences éventuelles de l’assureur.",
    },
    {
      question: "Puis-je garder mon ancienne clé ?",
      answer: "Après changement de cylindre, les anciennes clés ne correspondent plus. Je vous remets le jeu neuf.",
    },
  ],
  estimator: {
    label: "Estimation serrurerie",
    options: [
      { id: "ouverture", label: "Ouverture simple", base: 95, unit: "€" },
      { id: "cylindre", label: "Cylindre standard", base: 140, unit: "€" },
      { id: "double", label: "Double de clé", base: 15, unit: "€" },
    ],
  },
  hasBeforeAfter: true,
});
