import type { TradeMediaManifest } from "./mediaTypes";

/** Manifest média — electricien (chemins relatifs à public/img/electricien/) */
export const electricienMedia = {
  essentiel: {
    hero: "essentiel/01-hero.jpg",
    about: "essentiel/02-about.jpg",
    realisations: ["essentiel/03-realisation-tableau-neuf-maison-ancienne.jpg","essentiel/04-realisation-cuisine-tout-electrique.jpg","essentiel/05-realisation-borne-recharge-vehicule.jpg"],
  },
  avance: {
    hero: "avance/01-hero.jpg",
    about: "avance/02-about.jpg",
    realisations: ["avance/03-realisation-tableau-neuf-maison-ancienne.jpg","avance/04-realisation-cuisine-tout-electrique.jpg","avance/05-realisation-borne-recharge-vehicule.jpg","avance/06-realisation-eclairage-baies-et-terrasse.jpg","avance/07-realisation-appartement-renove-t3.jpg","avance/08-realisation-bureaux-open-space-cables.jpg"],
  },
  pro: {
    hero: "pro/01-hero.jpg",
    about: "pro/02-about.jpg",
    before: "pro/03-before-tableau-neuf-maison-ancienne.jpg",
    after: "pro/04-after-tableau-neuf-maison-ancienne.jpg",
    realisations: ["pro/05-realisation-tableau-neuf-maison-ancienne.jpg","pro/06-realisation-cuisine-tout-electrique.jpg","pro/07-realisation-borne-recharge-vehicule.jpg","pro/08-realisation-eclairage-baies-et-terrasse.jpg","pro/09-realisation-appartement-renove-t3.jpg","pro/10-realisation-bureaux-open-space-cables.jpg"],
    services: ["pro/11-service-mise-aux-normes-tableau-electrique.jpg","pro/12-service-renovation-electrique-maison.jpg","pro/13-service-bornes-de-recharge-vehicule.jpg","pro/14-service-eclairage-interieur-et-exterieur.jpg","pro/15-service-domotique-et-volets-connectes.jpg"],
  },
} as const satisfies TradeMediaManifest;
