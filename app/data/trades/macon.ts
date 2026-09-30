import { buildTrade } from "./_build";

export const macon = buildTrade({
  slug: "macon",
  label: "Maçon",
  labelPlural: "Maçons",
  shortLabel: "Maçon",
  tagline: "Gros œuvre, extensions et rénovation",
  specialty: "Murs, dalles, ouvertures et enduits",
  defaultFirstName: "Antoine",
  defaultLastName: "Martinez",
  defaultCompany: "Martinez Maçonnerie",
  defaultCity: "Montpellier",
  palette: {
    ink: "#3d3d3d",
    paper: "#f2f2f0",
    muted: "#888880",
    accent: "#e67e22",
    accentSoft: "#fdebd0",
    surface: "#e8e8e4",
  },
  about:
    "Maçon depuis vingt ans, je réalise extensions, murs de clôture, reprises sous œuvre et ravalements. Je coordonne avec les autres corps d’état quand le chantier l’exige. Chaque ouvrage est couvert par la garantie décennale.",
  services: [
    {
      title: "Extension et surélévation",
      description: "Fondations, élévation parpaing ou brique, plancher et ouvertures.",
      priceFrom: "1 200 €/m²",
    },
    {
      title: "Mur de clôture",
      description: "Parpaing enduit, pierre sèche ou bloc décoratif avec copings.",
      priceFrom: "180 €/ml",
    },
    {
      title: "Dalle et terrasse béton",
      description: "Dallage armé, forme pentes, reprise d’étanchéité sous carrelage.",
      priceFrom: "75 €/m²",
    },
    {
      title: "Ouverture mur porteur",
      description: "IPN ou poutre béton, étaiement, reprise enduits intérieurs.",
      priceFrom: "2 800 €",
    },
    {
      title: "Enduit façade",
      description: "Gratté, taloché ou monocouche, traitement fissures structurelles.",
      priceFrom: "38 €/m²",
    },
  ],
  projectTitles: [
    "Extension salon 20 m²",
    "Mur clôture parpaing",
    "Terrasse béton carrelée",
    "Ouverture cuisine ouverte",
    "Garage en parpaing",
    "Réparation fissures façade",
  ],
  projectSummaries: [
    "Dalle isolée, murs R+1 alignés sur l’existant, fenêtre baie côté jardin.",
    "Mur 2 m sur longueur 25 m, portillon maçonné et enduit deux tons.",
    "Dalle 35 m² avec drain et reprise étanchéité avant pose grès.",
    "IPN dissimulé, plâtre et peinture coordonnés avec le client.",
    "Box 30 m², porte sectionnelle réservée, dalle armée.",
    "Injections et armatures, enduit monocouche couleur sable.",
  ],
  projectTags: [
    ["extension", "parpaing", "agrandissement"],
    ["clôture", "mur", "extérieur"],
    ["dalle", "terrasse", "béton"],
    ["ouverture", "porteur", "rénovation"],
    ["garage", "construction", "box"],
    ["façade", "fissure", "enduit"],
  ],
  testimonials: [
    {
      name: "Rachid O.",
      city: "Castelnau-le-Lez",
      text: "Extension livrée comme prévu au devis. Chantier sécurisé, équipe sympa.",
    },
    {
      name: "Valérie J.",
      city: "Montpellier",
      text: "Ouverture du mur cuisine-salon parfaite, pas de fissure six mois après.",
    },
    {
      name: "Gérard F.",
      city: "Lattes",
      text: "Mur de clôture solide et bien aligné. Antoine explique chaque étape.",
    },
  ],
  faqs: [
    {
      question: "Faut-il un permis pour une extension ?",
      answer: "Au-delà de certaines surfaces, oui. Je vous indique déclaration préalable ou permis selon le projet.",
    },
    {
      question: "Intervenez-vous sur l’ancien en pierre ?",
      answer: "Oui, rejointoiement, reprise de linteaux et consolidation avec matériaux compatibles.",
    },
    {
      question: "Comment se paie le chantier ?",
      answer: "Acompte au démarrage, situations intermédiaires sur gros œuvre, solde à réception.",
    },
    {
      question: "Réalisez-vous le gros œuvre seul ?",
      answer: "Oui pour la maçonnerie ; charpente, couverture et menuiseries passent par des partenaires de confiance.",
    },
  ],
  estimator: {
    label: "Estimation maçonnerie",
    options: [
      { id: "mur", label: "Mur parpaing", base: 95, unit: "€ / m²" },
      { id: "dalle", label: "Dalle béton", base: 70, unit: "€ / m²" },
      { id: "cloture", label: "Mur clôture", base: 165, unit: "€ / ml" },
    ],
  },
  hasBeforeAfter: true,
});
