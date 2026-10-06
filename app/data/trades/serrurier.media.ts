import type { TradeMediaManifest } from "./mediaTypes";

/** Manifest média — serrurier (chemins relatifs à public/img/serrurier/) */
export const serrurierMedia = {
  essentiel: {
    hero: "essentiel/01-hero.jpg",
    about: "essentiel/02-about.jpg",
    realisations: ["essentiel/03-realisation-ouverture-porte-claquee.jpg","essentiel/04-realisation-cylindre-haute-securite.jpg","essentiel/05-realisation-doubles-de-cles-famille.jpg"],
  },
  avance: {
    hero: "avance/01-hero.jpg",
    about: "avance/02-about.jpg",
    realisations: ["avance/03-realisation-ouverture-porte-claquee.jpg","avance/04-realisation-cylindre-haute-securite.jpg","avance/05-realisation-doubles-de-cles-famille.jpg","avance/06-realisation-serrure-5-points-neuve.jpg","avance/07-realisation-porte-d-entree-renforcee.jpg","avance/08-realisation-depannage-cle-cassee.jpg"],
  },
  pro: {
    hero: "pro/01-hero.jpg",
    about: "pro/02-about.jpg",
    before: "pro/03-before-ouverture-porte-claquee.jpg",
    after: "pro/04-after-ouverture-porte-claquee.jpg",
    realisations: ["pro/05-realisation-ouverture-porte-claquee.jpg","pro/06-realisation-cylindre-haute-securite.jpg","pro/07-realisation-doubles-de-cles-famille.jpg","pro/08-realisation-serrure-5-points-neuve.jpg","pro/09-realisation-porte-d-entree-renforcee.jpg","pro/10-realisation-depannage-cle-cassee.jpg"],
    services: ["pro/11-service-ouverture-de-porte.jpg","pro/12-service-changement-de-cylindre.jpg","pro/13-service-double-de-cles.jpg","pro/14-service-serrure-multipoints.jpg","pro/15-service-blindage-et-securisation.jpg"],
  },
} as const satisfies TradeMediaManifest;
