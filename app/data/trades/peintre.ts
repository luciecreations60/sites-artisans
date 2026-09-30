import { buildTrade } from "./_build";

export const peintre = buildTrade({
  slug: "peintre",
  label: "Peintre",
  labelPlural: "Peintres",
  shortLabel: "Peintre",
  tagline: "Peinture intérieure et extérieure soignée",
  specialty: "Préparation des supports et finitions durables",
  defaultFirstName: "Laura",
  defaultLastName: "Girard",
  defaultCompany: "Girard Peinture Déco",
  defaultCity: "Bordeaux",
  palette: {
    ink: "#2d3436",
    paper: "#ffffff",
    muted: "#7f8c8d",
    accent: "#0984e3",
    accentSoft: "#dfeef9",
    surface: "#f5f6fa",
  },
  about:
    "Peintre en bâtiment, je prépare correctement les murs avant d’appliquer peintures, enduits ou papier peint. Je travaille avec des marques professionnelles adaptées aux pièces humides et aux façades. Les chantiers sont protégés et laissés propres en fin de journée.",
  services: [
    {
      title: "Peinture intérieure",
      description: "Murs et plafonds, deux couches, rebouchage fissures et lessivage si nécessaire.",
      priceFrom: "28 €/m²",
    },
    {
      title: "Ravalement de façade",
      description: "Nettoyage, traitement fissures, impression et finition siloxane ou acrylique.",
      priceFrom: "45 €/m²",
    },
    {
      title: "Pose de papier peint",
      description: "Intissé ou vinyle, pose à joints, découpes autour des ouvertures.",
      priceFrom: "32 €/m²",
    },
    {
      title: "Laque boiseries",
      description: "Portes, plinthes et fenêtres : ponçage, sous-couche et laque satinée ou mate.",
      priceFrom: "18 €/ml",
    },
    {
      title: "Enduit décoratif",
      description: "Enduit à la chaux, béton ciré mural ou effets talochés sur demande.",
      priceFrom: "55 €/m²",
    },
  ],
  projectTitles: [
    "Appartement T4 rénové",
    "Façade pierre Bordeaux",
    "Salon papier panoramique",
    "Bureaux open space",
    "Maison neuve finitions",
    "Escalier et paliers",
  ],
  projectSummaries: [
    "Peintures mates pièces de vie, satinée cuisine et satinée salle de bain.",
    "Ravalement deux tons, encadrements plus foncés, corniches restaurées.",
    "Papier intissé grand format, raccord invisible au plafond.",
    "Peinture lessivable blanc cassé, bandes de couleur sur cloisons.",
    "Prise en charge complète après plâtrier : plafonds et murs livrés prêts à meubler.",
    "Sous-couche accrochage sur anciennes peintures glycéro, laque blanche.",
  ],
  projectTags: [
    ["intérieur", "rénovation", "appartement"],
    ["façade", "ravalement", "extérieur"],
    ["papier peint", "décoration", "salon"],
    ["bureaux", "professionnel", "peinture"],
    ["neuf", "finitions", "maison"],
    ["boiseries", "escalier", "laque"],
  ],
  testimonials: [
    {
      name: "Camille B.",
      city: "Mérignac",
      text: "Travail très propre, couleurs exactement comme les nuanciers. Délais tenus.",
    },
    {
      name: "François A.",
      city: "Bordeaux",
      text: "Façade ravivée, voisins complimentés. Laura a bien géré la coordination avec l’échafaudage.",
    },
    {
      name: "Julie et Paul S.",
      city: "Pessac",
      text: "Peinture de toute la maison en une semaine. Prix conforme au devis.",
    },
  ],
  faqs: [
    {
      question: "Dois-je vider les pièces ?",
      answer: "Idéalement oui pour les murs complets. Sinon je déplace et bâche les meubles lourds avec vous.",
    },
    {
      question: "Quelle peinture pour une salle de bain ?",
      answer: "Peinture spéciale pièces humides avec traitement anti-moisissures en sous-couche si besoin.",
    },
    {
      question: "Peut-on peindre en hiver ?",
      answer: "En intérieur oui, avec aération. En extérieur, température et sécheresse doivent rester dans les tolérances produit.",
    },
    {
      question: "Fournissez-vous les peintures ?",
      answer: "Oui, incluses dans le devis sauf si vous préférez les acheter vous-même ; j’indique alors les références.",
    },
  ],
  estimator: {
    label: "Estimation peinture",
    options: [
      { id: "mur", label: "Murs intérieurs", base: 28, unit: "€ / m²" },
      { id: "plafond", label: "Plafonds", base: 32, unit: "€ / m²" },
      { id: "facade", label: "Façade", base: 42, unit: "€ / m²" },
    ],
  },
  hasBeforeAfter: true,
});
