import { buildTrade } from "./_build";

export const plombier = buildTrade({
  slug: "plombier",
  label: "Plombier",
  labelPlural: "Plombiers",
  shortLabel: "Plombier",
  tagline: "Plomberie et chauffage de confiance",
  specialty: "Dépannage, sanitaires et installations chauffage",
  defaultFirstName: "Karim",
  defaultLastName: "Benali",
  defaultCompany: "Benali Plomberie",
  defaultCity: "Lyon",
  palette: {
    ink: "#0f2a3d",
    paper: "#eef6fa",
    muted: "#5a7a8c",
    accent: "#0077b6",
    accentSoft: "#cce5f0",
    surface: "#dceef5",
  },
  about:
    "Plombier chauffagiste installé à Lyon depuis douze ans, j’interviens chez les particuliers et les petits commerces. Je privilégie des matériaux reconnus et un diagnostic clair avant chaque intervention. Les urgences fuites et débouchages sont traitées en priorité.",
  services: [
    {
      title: "Dépannage fuite et débouchage",
      description: "Intervention rapide pour fuites, WC bouchés, éviers et canalisations.",
      priceFrom: "95 €",
    },
    {
      title: "Salle de bain complète",
      description: "Remplacement baignoire ou douche, WC, vasque, robinetterie et carrelage coordonné.",
      priceFrom: "4 800 €",
    },
    {
      title: "Chauffe-eau et ballon thermodynamique",
      description: "Pose, remplacement et entretien de cumulus et chauffe-eau thermodynamiques.",
      priceFrom: "890 €",
    },
    {
      title: "Chaudière gaz ou pompe à chaleur",
      description: "Installation, entretien annuel obligatoire et mise aux normes.",
      priceFrom: "3 200 €",
    },
    {
      title: "Raccordements cuisine",
      description: "Arrivée d’eau, évacuations et robinetterie pour cuisine neuve ou rénovée.",
      priceFrom: "450 €",
    },
  ],
  projectTitles: [
    "Rénovation salle de bain",
    "Douche et robinetterie neuves",
    "Douche à l’italienne",
    "Remise en état point d’eau",
    "Salle d’eau PMR",
    "Cuisine équipée raccordée",
  ],
  projectSummaries: [
    "Douche walk-in, vasque sur meuble, faïence jusqu’au plafond.",
    "Remplacement douche, mitigeurs thermostatiques et joints neufs.",
    "Receveur extra-plat, paroi fixe, évacuation optimisée.",
    "Réparation fuite et reprise propre de la zone abîmée.",
    "Douche accessible, barres d’appui, WC surélevé aux normes.",
    "Lave-vaisselle, évier et lave-linge raccordés en une journée.",
  ],
  projectTags: [
    ["salle de bain", "rénovation", "douche"],
    ["douche", "robinetterie", "sanitaire"],
    ["douche", "italienne", "étanchéité"],
    ["dépannage", "fuite", "urgence"],
    ["accessibilité", "PMR", "sanitaire"],
    ["cuisine", "raccordement", "plomberie"],
  ],
  testimonials: [
    {
      name: "Nathalie V.",
      city: "Villeurbanne",
      text: "Fuite un dimanche soir : Karim est venu en moins d’une heure et a réglé le problème proprement.",
    },
    {
      name: "Jean-Pierre M.",
      city: "Lyon 3e",
      text: "Salle de bain refaite en trois semaines, devis respecté. Je recommande sans hésiter.",
    },
    {
      name: "Élodie K.",
      city: "Caluire",
      text: "Entretien chaudière et conseils pour baisser la facture. Personne sérieuse et ponctuelle.",
    },
  ],
  faqs: [
    {
      question: "Intervenez-vous en urgence le week-end ?",
      answer: "Oui, pour les fuites importantes et les débouchages bloquants, avec majoration affichée au préalable.",
    },
    {
      question: "Le devis est-il payant ?",
      answer: "Non pour les projets de rénovation. En dépannage simple, le déplacement peut être facturé si vous refusez l’intervention.",
    },
    {
      question: "Êtes-vous agréé assurance ?",
      answer: "Oui, je peux établir les documents pour votre assurance habitation en cas de sinistre couvert.",
    },
    {
      question: "Quelle garantie sur les installations ?",
      answer: "Garantie biennale sur l’équipement et décennale sur les ouvrages fixes, conformément à la loi.",
    },
  ],
  estimator: {
    label: "Estimation dépannage",
    options: [
      { id: "debouchage", label: "Débouchage simple", base: 120, unit: "€" },
      { id: "fuite", label: "Recherche de fuite", base: 180, unit: "€" },
      { id: "robinet", label: "Remplacement robinet", base: 95, unit: "€" },
    ],
  },
  hasBeforeAfter: true,
});
