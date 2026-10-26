import type { TradeData, TradeSlug } from "~/data/types";

/** Premier segment de phrase pour un chapô hero. */
export function firstSentence(text: string, max = 220): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^[^.!?]+[.!?]/);
  const sentence = (match ? match[0] : trimmed).trim();
  if (sentence.length <= max) return sentence;
  return `${sentence.slice(0, max - 1).trimEnd()}…`;
}

export type DemoCopy = {
  contactCta: string;
  galleryCta: string;
  galleryHeading: string;
  estimateCta: string;
  quoteCta: string;
  bookCta: string;
  beforeAfterCaption: string;
  quantityLabel: string;
  detailHint: string;
  heroLead: string;
  /** Lieu d’activité (atelier / institut / fournil…). */
  placeLabel: string;
  areaTitle: string;
  areaText: (city: string) => string;
  contactTitle: string;
  projectDetailCta: string;
  servicesLead: (city: string) => string;
  contactMotifs: { value: string; label: string }[];
};

const CARE = new Set<TradeSlug>(["bienetre", "coiffure"]);
const FOOD = new Set<TradeSlug>(["boulanger"]);
const COUNTER = new Set<TradeSlug>(["cordonnier", "garage", "serrurier"]);

function placeLabelFor(slug: TradeSlug): string {
  if (slug === "bienetre") return "L’institut";
  if (slug === "coiffure") return "Le salon";
  if (slug === "boulanger") return "Le fournil";
  if (slug === "garage") return "L’atelier";
  if (slug === "cordonnier") return "L’atelier";
  if (slug === "serrurier") return "L’atelier";
  return "L’atelier";
}

/**
 * Libellés UI des démos adaptés au métier (évite « chantier / travaux »
 * sur bien-être, boulangerie, etc.).
 */
export function demoCopy(trade: TradeData): DemoCopy {
  const heroLead = firstSentence(trade.about);
  const slug = trade.slug;
  const placeLabel = placeLabelFor(slug);

  if (CARE.has(slug)) {
    return {
      contactCta: "Prendre rendez-vous",
      galleryCta: "Voir la galerie",
      galleryHeading: "Galerie",
      estimateCta: "Estimer ce soin",
      quoteCta: "Demander un devis",
      bookCta: "Réserver",
      beforeAfterCaption:
        "Exemple illustratif — comparaison avant / après (démonstration, pas une prestation réelle).",
      quantityLabel: "Nombre de prestations",
      detailHint: "Soin souhaité, disponibilité, précisions…",
      heroLead,
      placeLabel,
      areaTitle: "Où nous trouver",
      areaText: (city) =>
        `Nous vous accueillons à ${city} — sur rendez-vous, dans un espace calme et soigné.`,
      contactTitle: "Réservez votre soin",
      projectDetailCta: "Voir un exemple en détail",
      servicesLead: (city) => `Au salon / institut à ${city}.`,
      contactMotifs: [
        { value: "soin", label: "Soin / prestation" },
        { value: "conseil", label: "Conseil / diagnostic" },
        { value: "rappel", label: "Être rappelé(e)" },
      ],
    };
  }

  if (FOOD.has(slug)) {
    return {
      contactCta: "Nous contacter",
      galleryCta: "Voir les créations",
      galleryHeading: "Créations",
      estimateCta: "Estimer cette commande",
      quoteCta: "Demander un devis",
      bookCta: "Commander",
      beforeAfterCaption:
        "Exemple illustratif — comparaison avant / après (démonstration, pas une commande réelle).",
      quantityLabel: "Quantité",
      detailHint: "Produit, quantité, date souhaitée…",
      heroLead,
      placeLabel,
      areaTitle: "Boutique",
      areaText: (city) =>
        `Venez nous voir à ${city} — pains, viennoiseries et commandes sur place ou à retirer.`,
      contactTitle: "Une commande ?",
      projectDetailCta: "Voir une création en détail",
      servicesLead: (city) => `Sur place à ${city} et commandes à emporter.`,
      contactMotifs: [
        { value: "commande", label: "Commande / traiteur" },
        { value: "info", label: "Renseignement" },
        { value: "rappel", label: "Être rappelé(e)" },
      ],
    };
  }

  if (COUNTER.has(slug)) {
    const isGarage = slug === "garage";
    return {
      contactCta: "Nous contacter",
      galleryCta: "Voir les réalisations",
      galleryHeading: "Réalisations",
      estimateCta: "Estimer cette intervention",
      quoteCta: "Demander un devis",
      bookCta: "Prendre rendez-vous",
      beforeAfterCaption:
        "Exemple illustratif — comparaison avant / après (démonstration, pas une intervention réelle).",
      quantityLabel: "Quantité",
      detailHint: "Nature de la demande, délai, précisions…",
      heroLead,
      placeLabel,
      areaTitle: isGarage || slug === "cordonnier" ? "Atelier" : "Zone d’intervention",
      areaText: (city) =>
        slug === "serrurier"
          ? `Intervention rapide autour de ${city} et communes voisines.`
          : `Atelier à ${city} — dépôt et reprise sur rendez-vous.`,
      contactTitle: "Parlons de votre besoin",
      projectDetailCta: "Voir une intervention en détail",
      servicesLead: (city) =>
        slug === "serrurier"
          ? `Intervention à ${city} et alentours.`
          : `Atelier à ${city}.`,
      contactMotifs: [
        { value: "rdv", label: "Rendez-vous atelier" },
        { value: "devis", label: "Devis" },
        ...(slug === "serrurier"
          ? [{ value: "urgence", label: "Urgence" }]
          : [{ value: "rappel", label: "Être rappelé(e)" }]),
      ],
    };
  }

  return {
    contactCta: "Me contacter",
    galleryCta: "Voir les réalisations",
    galleryHeading: "Réalisations",
    estimateCta: "Estimer ce type de travaux",
    quoteCta: "Demander un devis",
    bookCta: "Demander un devis",
    beforeAfterCaption:
      "Exemple illustratif — comparaison avant / après (démonstration, pas un chantier réel).",
    quantityLabel: "Surface ou quantité",
    detailHint: "Surface, délai, précisions…",
    heroLead,
    placeLabel,
    areaTitle: "Zone d’intervention",
    areaText: (city) =>
      `Intervention autour de ${city} et communes voisines — rayon adapté lors de la mise en production.`,
    contactTitle: "Parlons de votre projet",
    projectDetailCta: "Voir un projet en détail",
    servicesLead: (city) => `Intervention à ${city} et alentours.`,
    contactMotifs: [
      { value: "visite", label: "Visite sur place" },
      { value: "visio", label: "Appel / visio" },
      { value: "urgence", label: "Urgence" },
    ],
  };
}

/** Libellé quantité estimateur : override métier, sinon dérivé de l’unité. */
export function estimatorQuantityLabel(
  trade: TradeData,
  unit?: string,
): string {
  const custom = trade.estimator?.quantityLabel;
  if (custom) return custom;
  const u = (unit ?? "").toLowerCase();
  if (u.includes("m²") || u.includes("m2")) return "Surface (m²)";
  if (u === "€" || u.includes("forfait")) return demoCopy(trade).quantityLabel;
  if (u.includes("h")) return "Durée (heures)";
  if (u) return `Quantité (${unit})`;
  return demoCopy(trade).quantityLabel;
}
