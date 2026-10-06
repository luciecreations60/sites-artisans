import type { TradeMediaManifest } from "./mediaTypes";

/** Manifest média — paysagiste (chemins relatifs à public/img/paysagiste/) */
export const paysagisteMedia = {
  essentiel: {
    hero: "essentiel/01-hero.jpg",
    about: "essentiel/02-about.jpg",
    realisations: ["essentiel/03-realisation-jardin-mediterraneen.jpg","essentiel/04-realisation-terrasse-ombragee.jpg","essentiel/05-realisation-haie-brise-vue.jpg"],
  },
  avance: {
    hero: "avance/01-hero.jpg",
    about: "avance/02-about.jpg",
    realisations: ["avance/03-realisation-jardin-mediterraneen.jpg","avance/04-realisation-terrasse-ombragee.jpg","avance/05-realisation-haie-brise-vue.jpg","avance/06-realisation-massif-fleuri-printemps.jpg","avance/07-realisation-potager-sureleve.jpg","avance/08-realisation-cour-minerale-et-graminees.jpg"],
  },
  pro: {
    hero: "pro/01-hero.jpg",
    about: "pro/02-about.jpg",
    before: "pro/03-before-jardin-mediterraneen.jpg",
    after: "pro/04-after-jardin-mediterraneen.jpg",
    realisations: ["pro/05-realisation-jardin-mediterraneen.jpg","pro/06-realisation-terrasse-ombragee.jpg","pro/07-realisation-haie-brise-vue.jpg","pro/08-realisation-massif-fleuri-printemps.jpg","pro/09-realisation-potager-sureleve.jpg","pro/10-realisation-cour-minerale-et-graminees.jpg"],
    services: ["pro/11-service-creation-de-jardin.jpg","pro/12-service-entretien-mensuel.jpg","pro/13-service-terrasse-et-dallage.jpg","pro/14-service-clotures-et-portails.jpg","pro/15-service-arrosage-automatique.jpg"],
  },
} as const satisfies TradeMediaManifest;
