import { buildTrade } from "./_build";

export const cordonnier = buildTrade({
  slug: "cordonnier",
  label: "Cordonnier",
  labelPlural: "Cordonniers",
  shortLabel: "Cordonnier",
  tagline: "Réparation et entretien de chaussures",
  specialty: "Semelles, talons, cuir et sneakers",
  defaultFirstName: "Marcel",
  defaultLastName: "Fontaine",
  defaultCompany: "Cordonnerie Fontaine",
  defaultCity: "Amiens",
  palette: {
    ink: "#2c1810",
    paper: "#faf6f1",
    muted: "#8a6f5c",
    accent: "#8b4513",
    accentSoft: "#f0e0d0",
    surface: "#efe6dc",
  },
  about:
    "Cordonnier depuis quinze ans, je répare chaussures de ville, bottes et sneakers dans mon atelier du centre-ville. Semelles, talons, teinture et entretien du cuir : chaque paire est examinée avant devis. Je privilégie des matériaux durables et une finition soignée.",
  services: [
    {
      title: "Resemelage cuir ou crêpe",
      description: "Dépose de l’ancienne semelle, collage et finition pour une tenue prolongée.",
      priceFrom: "45 €",
    },
    {
      title: "Talons et embouts",
      description: "Remplacement talons, bouts et protège-talons sur escarpins et chaussures homme.",
      priceFrom: "18 €",
    },
    {
      title: "Entretien et teinture cuir",
      description: "Nettoyage, nourrissage, teinture et imperméabilisation des cuirs lisses ou velours.",
      priceFrom: "25 €",
    },
    {
      title: "Sneakers et semelles sport",
      description: "Collage semelles, restitution blancheur et réparation de mesh ou cuir synthétique.",
      priceFrom: "35 €",
    },
    {
      title: "Fermetures et coutures",
      description: "Remplacement tirettes, coutures déchirées et renforts intérieurs.",
      priceFrom: "22 €",
    },
  ],
  projectTitles: [
    "Bottes cuir resemelées",
    "Escarpins talons neufs",
    "Sneakers blanches restaurées",
    "Basket running semi-réparée",
    "Chaussures ville polishées",
    "Paire cuir teinte et nourrie",
  ],
  projectSummaries: [
    "Semelles crêpe, talons reforgés et finition cirée sur bottines marron.",
    "Talons aiguille remplacés, embouts anti-usure et équilibre vérifié.",
    "Nettoyage deep clean, semelle recollée et lacets neufs.",
    "Zone d’usure avant renforcée, semelle amortie recollée proprement.",
    "Polish, cirage et imperméabilisation pour une paire de ville.",
    "Teinture homogène, nourrissage profond et brillance contrôlée.",
  ],
  projectTags: [
    ["bottes", "cuir", "resemelage"],
    ["escarpins", "talons", "ville"],
    ["sneakers", "nettoyage", "blanc"],
    ["sport", "running", "réparation"],
    ["ville", "entretien", "cirage"],
    ["teinture", "cuir", "soin"],
  ],
  testimonials: [
    {
      name: "Claire D.",
      city: "Amiens",
      text: "Mes bottes préférées ont une seconde vie. Travail propre et délai tenu.",
    },
    {
      name: "Julien R.",
      city: "Longueau",
      text: "Sneakers blanches comme neuves, sans casser mon budget. Je recommande.",
    },
    {
      name: "Sophie M.",
      city: "Amiens",
      text: "Talons d’escarpins changés en 48 h avant un mariage. Parfait.",
    },
  ],
  faqs: [
    {
      question: "Combien de temps pour une réparation ?",
      answer: "En général 3 à 7 jours selon la pièce. Les urgences (talons, tirettes) peuvent être traitées plus vite.",
    },
    {
      question: "Réparez-vous les sneakers de marque ?",
      answer: "Oui, collages et nettoyages. Certains modèles très techniques sont évalués au cas par cas.",
    },
    {
      question: "Le devis est-il gratuit ?",
      answer: "Oui, après examen de la paire. Vous validez avant que je commence.",
    },
    {
      question: "Proposez-vous l’entretien sans réparation ?",
      answer: "Oui : nettoyage, cirage, teinture et imperméabilisation seuls.",
    },
  ],
  estimator: {
    label: "Estimation réparation",
    options: [
      { id: "talon", label: "Paire de talons", base: 22, unit: "€" },
      { id: "semelle", label: "Resemelage simple", base: 55, unit: "€" },
      { id: "entretien", label: "Entretien / cirage", base: 28, unit: "€" },
    ],
  },
});
