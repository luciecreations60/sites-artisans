import { buildTrade } from "./_build";

export const bienetre = buildTrade({
  slug: "bienetre",
  label: "Bien-être / Beauté",
  labelPlural: "Professionnels du bien-être",
  shortLabel: "Bien-être",
  tagline: "Soins du corps et du visage en institut",
  specialty: "Massages, esthétique et relaxation",
  defaultFirstName: "Marine",
  defaultLastName: "Chevalier",
  defaultCompany: "Institut Marine Chevalier",
  defaultCity: "Nice",
  palette: {
    ink: "#1a4d4a",
    paper: "#fafcfb",
    muted: "#6b9a96",
    accent: "#14b8a6",
    accentSoft: "#ccfbf1",
    surface: "#e6f7f5",
  },
  about:
    "Esthéticienne-masseuse, je propose soins du visage, massages bien-être et épilations dans un institut calme à deux pas de la Promenade. Chaque soin débute par un court échange pour adapter pression et produits. Hygiène et confort sont prioritaires.",
  services: [
    {
      title: "Massage relaxant",
      description: "Massage corps huiles neutres ou aromatiques, 45 ou 60 minutes.",
      priceFrom: "65 €",
    },
    {
      title: "Soin visage sur mesure",
      description: "Nettoyage, gommage, massage et masque selon type de peau.",
      priceFrom: "58 €",
    },
    {
      title: "Épilation à la cire",
      description: "Zones visage, jambes ou maillot avec cire tiède low-temperature.",
      priceFrom: "12 €",
    },
    {
      title: "Manucure et semi-permanent",
      description: "Pose vernis classique ou semi tenue deux semaines, soin cuticules.",
      priceFrom: "35 €",
    },
    {
      title: "Rituel détente duo",
      description: "Deux massages synchronisés en cabine double, tisane offerte.",
      priceFrom: "130 €",
    },
  ],
  projectTitles: [
    "Massage pierres chaudes",
    "Soin anti-âge visage",
    "Forfait mariée",
    "Réflexologie plantaire",
    "Gommage corps et enveloppement",
    "Atelier relaxation entreprise",
  ],
  projectSummaries: [
    "Basaltes volcaniques et huile d’argan, dénouement dos et nuque.",
    "Acide hyaluronique et massage liftant, peau repulpée visiblement.",
    "Soin visage, manucure et coiffure légère la veille du mariage.",
    "Points réflexes pieds 30 min, relâchement jambes lourdes.",
    "Gommage sel marin puis enveloppe algues, peau lisse.",
    "Séance 20 min chaise pour équipe de dix, sur site ou en institut.",
  ],
  projectTags: [
    ["pierres chaudes"],
    ["anti-âge"],
    ["mariage"],
    ["réflexologie"],
    ["gommage"],
    ["entreprise"],
  ],
  testimonials: [
    {
      name: "Émilie R.",
      city: "Nice",
      text: "Institut propre et accueillant. Le massage 60 min m’a vraiment détendue, pression parfaite.",
    },
    {
      name: "Carole S.",
      city: "Cagnes-sur-Mer",
      text: "Soin visage sans agresser ma peau sensible. Marine explique chaque étape.",
    },
    {
      name: "Julien et Anaïs",
      city: "Antibes",
      text: "Rituel duo pour notre anniversaire : moment simple et très agréable.",
    },
  ],
  faqs: [
    {
      question: "Comment annuler un rendez-vous ?",
      answer: "Merci de prévenir 24 h à l’avance par SMS ou téléphone, sinon la prestation peut être facturée.",
    },
    {
      question: "Les soins sont-ils adaptés aux femmes enceintes ?",
      answer: "Massages spécifiques à partir du 4e mois sur devis médical ; certains soins visage sans actifs forts.",
    },
    {
      question: "Proposez-vous des cartes cadeaux ?",
      answer: "Oui, montant libre ou forfait soin, validité un an, remise en main propre ou par mail.",
    },
    {
      question: "Quels moyens de paiement ?",
      answer: "Carte bancaire, espèces et paiement en plusieurs fois sans frais à partir de 150 €.",
    },
  ],
  estimator: {
    label: "Estimation soins",
    options: [
      { id: "massage-45", label: "Massage 45 min", base: 65, unit: "€" },
      { id: "visage", label: "Soin visage", base: 58, unit: "€" },
      { id: "manucure", label: "Manucure semi-permanent", base: 42, unit: "€" },
    ],
  },
});
