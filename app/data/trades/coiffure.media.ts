import type { TradeMediaManifest } from "./mediaTypes";

/** Manifest média — coiffure (chemins relatifs à public/img/coiffure/) */
export const coiffureMedia = {
  essentiel: {
    hero: "essentiel/01-hero.jpg",
    about: "essentiel/02-about.jpg",
    realisations: ["essentiel/03-realisation-balayage-naturel.jpg","essentiel/04-realisation-degrade-barbe-sculptee.jpg","essentiel/05-realisation-coupe-pixie-structuree.jpg"],
  },
  avance: {
    hero: "avance/01-hero.jpg",
    about: "avance/02-about.jpg",
    realisations: ["avance/03-realisation-balayage-naturel.jpg","avance/04-realisation-degrade-barbe-sculptee.jpg","avance/05-realisation-coupe-pixie-structuree.jpg","avance/06-realisation-chignon-mariage.jpg","avance/07-realisation-coloration-vegetale.jpg","avance/08-realisation-transformation-coupe-longue.jpg"],
  },
  pro: {
    hero: "pro/01-hero.jpg",
    about: "pro/02-about.jpg",
    before: "pro/03-before-balayage-naturel.jpg",
    after: "pro/04-after-balayage-naturel.jpg",
    realisations: ["pro/05-realisation-balayage-naturel.jpg","pro/06-realisation-degrade-barbe-sculptee.jpg","pro/07-realisation-coupe-pixie-structuree.jpg","pro/08-realisation-chignon-mariage.jpg","pro/09-realisation-coloration-vegetale.jpg","pro/10-realisation-transformation-coupe-longue.jpg"],
    services: ["pro/11-service-coupe-femme.jpg","pro/12-service-coupe-homme-et-barbe.jpg","pro/13-service-couleur-et-meches.jpg","pro/14-service-coiffure-evenement.jpg","pro/15-service-forfait-enfant.jpg"],
  },
} as const satisfies TradeMediaManifest;
