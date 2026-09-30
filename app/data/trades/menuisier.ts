import { buildTrade } from "./_build";

export const menuisier = buildTrade({
  slug: "menuisier",
  label: "Menuisier",
  labelPlural: "Menuisiers",
  shortLabel: "Menuisier",
  tagline: "Menuiserie sur mesure pour votre maison",
  specialty: "Agencements, fenêtres et escaliers en bois",
  defaultFirstName: "Julien",
  defaultLastName: "Moreau",
  defaultCompany: "Atelier Moreau Menuiserie",
  defaultCity: "Annecy",
  palette: {
    ink: "#2c2416",
    paper: "#f7f3eb",
    muted: "#8a7d6b",
    accent: "#b8860b",
    accentSoft: "#e8dcc4",
    surface: "#efe8da",
  },
  about:
    "Je fabrique et pose des ouvrages en bois depuis quinze ans, en privilégiant le chêne et le pin des Alpes. Chaque projet est étudié avec vous pour s’adapter à votre intérieur et à votre budget. Je travaille seul ou avec un compagnon pour les chantiers plus importants.",
  services: [
    {
      title: "Fenêtres et portes sur mesure",
      description: "Fabrication et pose de menuiseries bois ou mixte bois-aluminium, double vitrage inclus.",
      priceFrom: "850 €",
    },
    {
      title: "Escaliers et garde-corps",
      description: "Escaliers droits ou quart tournant, finitions huilées ou vernies selon vos goûts.",
      priceFrom: "4 500 €",
    },
    {
      title: "Placards et dressings",
      description: "Agencement sur mesure avec tiroirs, étagères et portes coulissantes ou battantes.",
      priceFrom: "1 200 €",
    },
    {
      title: "Cuisine bois",
      description: "Plan de travail, façades et îlot en bois massif ou stratifié haut de gamme.",
      priceFrom: "6 000 €",
    },
    {
      title: "Rénovation de parquet",
      description: "Ponçage, vitrification ou huilage de parquets anciens et modernes.",
      priceFrom: "35 €/m²",
    },
  ],
  projectTitles: [
    "Escalier chêne massif",
    "Baies vitrées salon",
    "Dressing sous combles",
    "Porte d’entrée sur mesure",
    "Bibliothèque murale",
    "Véranda bois-alu",
  ],
  projectSummaries: [
    "Escalier deux quart tournant en chêne, rampe tournée à la main.",
    "Trois baies coulissantes ouvrant sur le jardin, isolation renforcée.",
    "Aménagement complet sous rampant avec portes coulissantes.",
    "Porte blindée habillée bois, serrure multipoints.",
    "Bibliothèque du sol au plafond avec échelle coulissante.",
    "Extension véranda avec structure bois et toiture vitrée.",
  ],
  projectTags: [
    ["escalier", "chêne", "intérieur"],
    ["fenêtre", "baie vitrée", "isolation"],
    ["dressing", "rangement", "combles"],
    ["porte", "sécurité", "entrée"],
    ["bibliothèque", "sur mesure", "salon"],
    ["véranda", "extension", "lumière"],
  ],
  testimonials: [
    {
      name: "Claire D.",
      city: "Annecy",
      text: "Escalier livré dans les délais, finition impeccable. Julien a su nous conseiller sur le choix du bois.",
    },
    {
      name: "Marc et Sophie L.",
      city: "Rumilly",
      text: "Notre dressing sous combles est exactement ce qu’on imaginait. Travail soigné et chantier propre.",
    },
    {
      name: "Philippe R.",
      city: "La Roche-sur-Foron",
      text: "Remplacement de toutes nos fenêtres : devis clair, pose rapide, facture conforme au devis.",
    },
  ],
  faqs: [
    {
      question: "Quels délais pour une fenêtre sur mesure ?",
      answer: "Comptez environ quatre à six semaines entre la prise de mesures et la pose, selon la période.",
    },
    {
      question: "Travaillez-vous avec du bois local ?",
      answer: "Oui, je source auprès de scieries en Savoie et Haute-Savoie lorsque le projet le permet.",
    },
    {
      question: "Proposez-vous un devis gratuit ?",
      answer: "Le déplacement et le devis détaillé sont gratuits dans un rayon de 30 km autour d’Annecy.",
    },
    {
      question: "Assurez-vous les ouvrages ?",
      answer: "Tous mes travaux sont couverts par la garantie décennale et une garantie de parfait achèvement.",
    },
  ],
  estimator: {
    label: "Estimation fenêtres",
    options: [
      { id: "fen-simple", label: "Fenêtre standard", base: 650, unit: "€ / unité" },
      { id: "fen-baie", label: "Baie vitrée", base: 1200, unit: "€ / unité" },
      { id: "porte-ext", label: "Porte extérieure bois", base: 1800, unit: "€ / unité" },
    ],
  },
});
