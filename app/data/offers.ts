import { STATIC_PLANS } from "~/data/catalog/staticCatalog";
import type { OfferTier } from "~/data/types";
import { formatEuro } from "~/lib/format";
import { centsToEuroLabel } from "~/lib/catalog/pricing";

/**
 * Passer à `true` lorsque le configurateur tarifaire est opérationnel.
 * Active la formulation définitive sur l’accueil (tarif immédiat).
 */
export const PRICING_CONFIGURATOR_LIVE = true;

export const HOME_VALUE_PROP = {
  interim:
    "Choisissez votre métier, personnalisez votre futur site et découvrez nos offres en toute transparence.",
  final:
    "Choisissez votre métier, personnalisez votre site et estimez votre tarif en quelques étapes. Le devis détaillé suit après échange.",
} as const;

export function homeValuePropLine(): string {
  return PRICING_CONFIGURATOR_LIVE ? HOME_VALUE_PROP.final : HOME_VALUE_PROP.interim;
}

export type OfferFeature = {
  label: string;
  essentiel: boolean | string;
  avance: boolean | string;
  pro: boolean | string;
};

export type OfferPlan = {
  tier: OfferTier;
  name: string;
  tagline: string;
  /** Prix de création de référence (euros). Susceptible d’ajustement. */
  setupPrice: number;
  /** Centimes — source catalogue. */
  setupPriceCents: number;
  highlights: string[];
};

/** Libellé d’affichage du prix de création (ex. « 490 € »). */
export function formatSetupPrice(amount: number): string {
  return formatEuro(amount);
}

export function formatSetupPriceCents(cents: number): string {
  return centsToEuroLabel(cents);
}

/**
 * Notes commerciales partagées — création vs frais tiers vs maintenance.
 * Hébergement : prix indicatifs OVH Starter (renouvellement ~2,59 € HT/mois, oct. 2026).
 * Maintenance : forfait Site AZ facultatif (hébergement non inclus).
 */
export const commercialNotes = {
  setupOnly: "Prix de création de référence — devis détaillé après échange.",
  hosting:
    "À votre charge auprès d’OVH (ou d’un autre fournisseur) : à partir d’environ 2,60 € HT/mois (~31 € HT/an) pour un hébergement Starter au tarif de renouvellement. Nom de domaine souvent offert la 1re année, puis quelques euros par an. Vous souscrivez et payez directement le fournisseur — je vous accompagne pour le paramétrage et la prise en main.",
  maintenance:
    "Facultative, à partir de 29 € HT/mois : mises à jour techniques, surveillance, sauvegardes et petites corrections sur le site. L’hébergement et le nom de domaine restent séparés (chez OVH ou autre). Jamais imposée.",
  thirdParty:
    "Les outils métier externes (agenda, paiement, etc.) restent à votre charge auprès de leurs éditeurs. Sur le site, on peut simplement intégrer un lien vers ces outils.",
  /** Note de bas de page du comparatif — lignes marquées *. */
  atYourChargeFootnote:
    "* À votre charge : frais payés directement au fournisseur (OVH, éditeur d’outil, etc.), hors prix de création Site AZ. Pour l’hébergement et le nom de domaine, je vous accompagne au paramétrage et à la prise en main. Pour les outils externes, un lien depuis votre site suffit souvent.",
} as const;

const HIGHLIGHTS: Record<OfferTier, string[]> = {
  essentiel: [
    "Une page unique soignée",
    "Coordonnées et formulaire de contact",
    "Présentation de vos services",
    "Quelques réalisations",
    "Adapté mobile",
  ],
  avance: [
    "Plusieurs pages (accueil, services, réalisations…)",
    "Filtrage des projets par type",
    "Demande de devis guidée",
    "Zone d’intervention visible",
    "Espace client pour le suivi de projet",
  ],
  pro: [
    "Design immersif et pages détaillées",
    "Fiches projet avec photos avant / après",
    "Estimateur indicatif en ligne",
    "Formulaire de contact / demande de rendez-vous",
    "Accompagnement contenu au lancement",
  ],
};

/** Adaptateur marketing → catalogue (prix uniques via STATIC_PLANS). */
export const offerPlans: OfferPlan[] = STATIC_PLANS.map((plan) => ({
  tier: plan.id,
  name: plan.name,
  tagline: plan.description,
  setupPrice: plan.setupPriceCents / 100,
  setupPriceCents: plan.setupPriceCents,
  highlights: HIGHLIGHTS[plan.id],
}));

export const comparisonFeatures: OfferFeature[] = [
  { label: "Nombre de pages", essentiel: "1 page", avance: "5 pages environ", pro: "8 pages et plus" },
  { label: "Design & direction artistique", essentiel: "Sobre et clair", avance: "Éditorial soigné", pro: "Sur-mesure immersif" },
  { label: "Présentation des services", essentiel: "Liste simple", avance: "Pages détaillées", pro: "Pages + mise en avant" },
  { label: "Galerie / réalisations", essentiel: "3 projets", avance: "Galerie filtrable", pro: "Fiches projet détaillées" },
  { label: "Photos avant / après", essentiel: false, avance: false, pro: true },
  { label: "Formulaire de contact", essentiel: true, avance: true, pro: true },
  { label: "Bouton d’appel sur mobile", essentiel: true, avance: true, pro: true },
  { label: "Demande de devis", essentiel: false, avance: "Formulaire guidé", pro: "Guidé + estimateur" },
  { label: "Estimateur en ligne", essentiel: false, avance: false, pro: true },
  {
    label: "Prise de rendez-vous",
    essentiel: "Option (lien / outil externe)*",
    avance: "Option (lien / outil externe)*",
    pro: "Option (lien / outil externe)*",
  },
  { label: "Zone d’intervention", essentiel: "Mention", avance: "Mise en avant", pro: "Mise en avant" },
  { label: "Avis clients", essentiel: true, avance: true, pro: true },
  { label: "Optimisation mobile", essentiel: true, avance: true, pro: true },
  { label: "Bases du référencement local", essentiel: true, avance: "Renforcé", pro: "Renforcé" },
  {
    label: "Nom de domaine*",
    essentiel: "À votre charge*",
    avance: "À votre charge*",
    pro: "À votre charge*",
  },
  {
    label: "Hébergement*",
    essentiel: "À votre charge* (indic. dès ~2,60 € HT/mois)",
    avance: "À votre charge* (indic. dès ~2,60 € HT/mois)",
    pro: "À votre charge* (indic. dès ~2,60 € HT/mois)",
  },
  {
    label: "Maintenance Site AZ",
    essentiel: "Facultative (dès 29 € HT/mois)",
    avance: "Facultative (dès 29 € HT/mois)",
    pro: "Facultative (dès 29 € HT/mois)",
  },
  { label: "Espace client suivi de projet", essentiel: "Inclus", avance: "Inclus", pro: "Inclus" },
  { label: "Accompagnement rédaction", essentiel: "Textes de base", avance: "Textes complets", pro: "Textes + storytelling" },
];

export const tierLabels: Record<OfferTier, string> = {
  essentiel: "Essentiel",
  avance: "Avancé",
  pro: "Pro",
};
