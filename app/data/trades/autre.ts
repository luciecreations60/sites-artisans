import { buildTrade } from "./_build";

export const autre = buildTrade({
  slug: "autre",
  label: "Artisan (autre activité)",
  labelPlural: "Artisans",
  shortLabel: "Artisan",
  tagline: "Votre métier, votre savoir-faire local",
  specialty: "Prestations artisanales sur mesure",
  defaultFirstName: "Alexandre",
  defaultLastName: "Renard",
  defaultCompany: "Atelier Renard",
  defaultCity: "Tours",
  palette: {
    ink: "#1e3a5f",
    paper: "#f8fafc",
    muted: "#647896",
    accent: "#0ea5e9",
    accentSoft: "#e0f2fe",
    surface: "#eef2f7",
  },
  about:
    "Artisan indépendant, je réalise des prestations adaptées à chaque client avec un devis clair avant intervention. La qualité du travail et le respect des délais guident ma pratique au quotidien. N’hésitez pas à me décrire votre projet par téléphone ou par mail.",
  services: [
    {
      title: "Prestation sur devis",
      description: "Étude de votre demande, visite si nécessaire et proposition chiffrée détaillée.",
      priceFrom: "Sur devis",
    },
    {
      title: "Intervention standard",
      description: "Travaux ou services courants dans mon domaine d’activité.",
      priceFrom: "75 €",
    },
    {
      title: "Forfait demi-journée",
      description: "Bloc de quatre heures pour chantier ou mission chez vous.",
      priceFrom: "280 €",
    },
    {
      title: "Forfait journée",
      description: "Huit heures de prestation avec pause déjeuner incluse côté planning.",
      priceFrom: "520 €",
    },
    {
      title: "Suivi et entretien",
      description: "Visites régulières ou maintenance préventive selon contrat simple.",
      priceFrom: "95 €",
    },
  ],
  projectTitles: [
    "Mission sur mesure client A",
    "Rénovation locale commerciale",
    "Intervention particulier",
    "Contrat entretien annuel",
    "Projet associatif local",
    "Prestation urgente",
  ],
  projectSummaries: [
    "Travaux adaptés au besoin exact, livraison dans les délais convenus.",
    "Aménagement intérieur coordonné avec le gérant, ouverture respectée.",
    "Diagnostic sur place et correction le jour même.",
    "Trois passages par an, rapport simple après chaque visite.",
    "Tarif préférentiel pour association de quartier, matériaux fournis par le client.",
    "Créneau soir pour limiter l’impact sur l’activité du client.",
  ],
  projectTags: [
    ["sur mesure", "devis", "artisan"],
    ["commerce", "rénovation", "local"],
    ["particulier", "intervention", "service"],
    ["entretien", "contrat", "suivi"],
    ["associatif", "quartier", "engagement"],
    ["urgence", "flexibilité", "proximité"],
  ],
  testimonials: [
    {
      name: "Sylvie M.",
      city: "Tours",
      text: "Réponse rapide, devis compréhensible et travail soigné. Je referai appel à l’atelier.",
    },
    {
      name: "Bruno C.",
      city: "Saint-Cyr-sur-Loire",
      text: "Personne de confiance : il prévient en cas de retard et tient parole sur le prix.",
    },
    {
      name: "Association Les Voisins",
      city: "Joué-lès-Tours",
      text: "Collaboration simple pour notre local : disponible et à l’écoute du budget.",
    },
  ],
  faqs: [
    {
      question: "Comment obtenir un devis ?",
      answer: "Décrivez votre besoin par mail ou téléphone ; une visite gratuite est proposée si le projet le nécessite.",
    },
    {
      question: "Quelle zone couvrez-vous ?",
      answer: "Tours et agglomération, jusqu’à 40 km pour les chantiers d’une journée ou plus.",
    },
    {
      question: "Travaillez-vous le week-end ?",
      answer: "Sur demande et avec majoration affichée à l’avance, selon disponibilité.",
    },
    {
      question: "Êtes-vous assuré ?",
      answer: "Responsabilité civile professionnelle et garantie décennale lorsque la nature des travaux l’exige.",
    },
  ],
});
