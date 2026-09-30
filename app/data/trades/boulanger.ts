import { buildTrade } from "./_build";

export const boulanger = buildTrade({
  slug: "boulanger",
  label: "Boulanger / Pâtissier",
  labelPlural: "Boulangers",
  shortLabel: "Boulanger",
  tagline: "Pain au levain et pâtisseries artisanales",
  specialty: "Boulangerie tradition et viennoiseries",
  defaultFirstName: "Pierre",
  defaultLastName: "Lambert",
  defaultCompany: "Boulangerie Lambert",
  defaultCity: "Lille",
  palette: {
    ink: "#3e2723",
    paper: "#fffef9",
    muted: "#8d6e63",
    accent: "#c17817",
    accentSoft: "#f5e6c8",
    surface: "#faf6ef",
  },
  about:
    "Boulanger-pâtissier, je pétris et cuise sur place chaque nuit pour servir un pain au levain naturel et des viennoiseries au beurre. Les farines viennent de meuniers du Nord. Commandes spéciales pour événements familiaux ou professionnels sur devis.",
  services: [
    {
      title: "Pain au levain",
      description: "Baguettes tradition, pains de campagne et miches longue fermentation.",
      priceFrom: "1,30 €",
    },
    {
      title: "Viennoiseries",
      description: "Croissants, pains au chocolat et brioches feuilletées du jour.",
      priceFrom: "1,20 €",
    },
    {
      title: "Pâtisseries individuelles",
      description: "Tartes, entremets et choux garnis selon arrivage du matin.",
      priceFrom: "3,50 €",
    },
    {
      title: "Gâteaux sur commande",
      description: "Pièces montées, number cakes et buffets sucrés pour 10 à 80 personnes.",
      priceFrom: "45 €",
    },
    {
      title: "Snacking salé",
      description: "Quiches, sandwiches baguette et salades composées à emporter.",
      priceFrom: "4,90 €",
    },
  ],
  projectTitles: [
    "Miche levain 48 h",
    "Buffet petit-déjeuner entreprise",
    "Gâteau mariage pièce montée",
    "Farandole viennoiseries",
    "Pain sans gluten du jeudi",
    "Bûche de Noël artisanale",
  ],
  projectSummaries: [
    "Farine T65, hydratation 70 %, croûte épaisse caramélisée.",
    "120 croissants et 80 pains au chocolat livrés à 7 h en entreprise.",
    "Choux montés vanille-framboise pour 60 parts, décoration fleurs sucre.",
    "Plateau assorti pour inauguration boutique, livraison matinale.",
    "Recette dédiée farine riz et sarrasin, cuisson four séparé.",
    "Parfums praliné, citron et chocolat, décors chocolat blanc.",
  ],
  projectTags: [
    ["pain", "levain", "tradition"],
    ["entreprise", "viennoiserie", "traiteur"],
    ["mariage", "pâtisserie", "événement"],
    ["catering", "croissant", "commande"],
    ["sans gluten", "spécialité", "boulangerie"],
    ["fêtes", "bûche", "chocolat"],
  ],
  testimonials: [
    {
      name: "Christine W.",
      city: "Lille",
      text: "Le pain levain est incomparable, croûte croustillante et mie alvéolée. Mon boulanger du quartier.",
    },
    {
      name: "SARL Nord Events",
      city: "Roubaix",
      text: "Livraisons toujours à l’heure pour nos séminaires. Qualité constante depuis trois ans.",
    },
    {
      name: "Maxime D.",
      city: "Tourcoing",
      text: "Gâteau d’anniversaire sur mesure, goût et présentation au top pour le prix annoncé.",
    },
  ],
  faqs: [
    {
      question: "À quelle heure sort le pain ?",
      answer: "Premières baguettes vers 7 h, miche levain vers 8 h 30. Arrivez tôt en week-end.",
    },
    {
      question: "Commande de gâteau : quel délai ?",
      answer: "Minimum 72 h, une semaine pour les grandes pièces montées ou mariages.",
    },
    {
      question: "Proposez-vous du bio ?",
      answer: "Une ligne baguette et pain complet en farine bio certifiée, disponible tous les jours.",
    },
    {
      question: "Livrez-vous ?",
      answer: "Livraison gratuite en centre-ville de Lille à partir de 80 € pour les professionnels.",
    },
  ],
});
