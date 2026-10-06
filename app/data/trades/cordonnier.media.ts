import type { TradeMediaManifest } from "./mediaTypes";

/** Manifest média — cordonnier (chemins relatifs à public/img/cordonnier/) */
export const cordonnierMedia = {
  essentiel: {
    hero: "essentiel/01-hero.jpg",
    about: "essentiel/02-about.jpg",
    realisations: ["essentiel/03-realisation-bottes-cuir-resemelees.jpg","essentiel/04-realisation-escarpins-talons-neufs.jpg","essentiel/05-realisation-sneakers-blanches-restaurees.jpg"],
  },
  avance: {
    hero: "avance/01-hero.jpg",
    about: "avance/02-about.jpg",
    realisations: ["avance/03-realisation-bottes-cuir-resemelees.jpg","avance/04-realisation-escarpins-talons-neufs.jpg","avance/05-realisation-sneakers-blanches-restaurees.jpg","avance/06-realisation-basket-running-semi-reparee.jpg","avance/07-realisation-chaussures-ville-polishees.jpg","avance/08-realisation-paire-cuir-teinte-et-nourrie.jpg"],
  },
  pro: {
    hero: "pro/01-hero.jpg",
    about: "pro/02-about.jpg",
    before: "pro/03-before-bottes-cuir-resemelees.jpg",
    after: "pro/04-after-bottes-cuir-resemelees.jpg",
    realisations: ["pro/05-realisation-bottes-cuir-resemelees.jpg","pro/06-realisation-escarpins-talons-neufs.jpg","pro/07-realisation-sneakers-blanches-restaurees.jpg","pro/08-realisation-basket-running-semi-reparee.jpg","pro/09-realisation-chaussures-ville-polishees.jpg","pro/10-realisation-paire-cuir-teinte-et-nourrie.jpg"],
    services: ["pro/11-service-resemelage-cuir-ou-crepe.jpg","pro/12-service-talons-et-embouts.jpg","pro/13-service-entretien-et-teinture-cuir.jpg","pro/14-service-sneakers-et-semelles-sport.jpg","pro/15-service-fermetures-et-coutures.jpg"],
  },
} as const satisfies TradeMediaManifest;
