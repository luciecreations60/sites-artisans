import { buildTrade } from "./_build";

export const couvreur = buildTrade({
  slug: "couvreur",
  label: "Couvreur",
  labelPlural: "Couvreurs",
  shortLabel: "Couvreur",
  tagline: "Toiture, zinguerie et charpente",
  specialty: "Réfection toiture, tuiles et ardoises",
  defaultFirstName: "Éric",
  defaultLastName: "Dubois",
  defaultCompany: "Couverture Dubois",
  defaultCity: "Rennes",
  palette: {
    ink: "#1e2933",
    paper: "#f4f6f8",
    muted: "#64748b",
    accent: "#c0392b",
    accentSoft: "#fadbd8",
    surface: "#e2e8f0",
  },
  about:
    "Couvreur-zingueur, je répare et refais les toitures en tuiles, ardoises et bac acier dans l’Ille-et-Vilaine. La sécurité du chantier et l’étanchéité durable guident mon travail. Je vous remets un devis photo et un planning avant de commencer.",
  services: [
    {
      title: "Réparation de toiture",
      description: "Tuiles cassées, faîtage, noues et reprise d’étanchéité localisée.",
      priceFrom: "280 €",
    },
    {
      title: "Réfection complète toiture",
      description: "Dépose, écran sous-toiture, liteaux et pose de tuiles ou ardoises neuves.",
      priceFrom: "85 €/m²",
    },
    {
      title: "Zinguerie et gouttières",
      description: "Chéneaux zinc ou alu, descentes, solins et habillages de lucarnes.",
      priceFrom: "45 €/ml",
    },
    {
      title: "Isolation combles par l’extérieur",
      description: "Sarking, panneaux isolants et couverture neuve pour performance thermique.",
      priceFrom: "120 €/m²",
    },
    {
      title: "Démoussage et hydrofuge",
      description: "Nettoyage toiture et traitement anti-mousse avec garantie produit.",
      priceFrom: "18 €/m²",
    },
  ],
  projectTitles: [
    "Toiture tuiles mécaniques",
    "Ardoises naturelles Bretonne",
    "Lucarne et chatière",
    "Gouttières zinc neuf",
    "Réparation après tempête",
    "Charpente renfort fermette",
  ],
  projectSummaries: [
    "Remplacement de 120 m² de tuiles, velux neufs et noue refaite.",
    "Pose ardoise sur maison de ville, zinguerie au plomb traditionnelle.",
    "Création lucarne côté jardin, étanchéité lead-free conforme.",
    "Chéneaux zinc 25/10 sur périphérie complète de la maison.",
    "Reprise de 40 tuines et banchement provisoire le jour même.",
    "Renfort structure suite infiltration, traitement bois inclus.",
  ],
  projectTags: [
    ["tuile", "réfection", "étanchéité"],
    ["ardoise", "patrimoine", "couverture"],
    ["lucarne", "fenêtre", "zinguerie"],
    ["gouttière", "zinc", "évacuation"],
    ["dépannage", "tempête", "urgence"],
    ["charpente", "structure", "réparation"],
  ],
  testimonials: [
    {
      name: "Bernard T.",
      city: "Cesson-Sévigné",
      text: "Toiture refaite avant l’hiver, équipe soigneuse, chantier nettoyé chaque soir.",
    },
    {
      name: "Marie-Odile P.",
      city: "Fougères",
      text: "Devis détaillé avec photos drone. Le résultat tient ses promesses depuis cinq ans.",
    },
    {
      name: "Stéphane W.",
      city: "Rennes",
      text: "Intervention rapide après la tempête. Prix honnête pour la réparation.",
    },
  ],
  faqs: [
    {
      question: "Une réfection complète est-elle éligible MaPrimeRénov’ ?",
      answer: "L’isolation par l’extérieur ou certains travaux couplés peuvent l’être ; je vous oriente vers un conseiller RGE.",
    },
    {
      question: "Travaillez-vous par tous les temps ?",
      answer: "Non, la pluie et le vent fort arrêtent la pose pour votre sécurité et la qualité de l’étanchéité.",
    },
    {
      question: "Quelle garantie sur la couverture ?",
      answer: "Garantie décennale sur l’ouvrage et garantie fabricant sur les tuiles selon les fiches techniques.",
    },
    {
      question: "Faut-il un échafaudage complet ?",
      answer: "Souvent oui pour une réfection ; pour une réparation localisée, un nacelle ou échafaudage partiel suffit.",
    },
  ],
});
