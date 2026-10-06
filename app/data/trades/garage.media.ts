import type { TradeMediaManifest } from "./mediaTypes";

/** Manifest média — garage (chemins relatifs à public/img/garage/) */
export const garageMedia = {
  essentiel: {
    hero: "essentiel/01-hero.jpg",
    about: "essentiel/02-about.jpg",
    realisations: ["essentiel/03-realisation-revision-complete-citadine.jpg","essentiel/04-realisation-freins-avant-suv.jpg","essentiel/05-realisation-distribution-diesel.jpg"],
  },
  avance: {
    hero: "avance/01-hero.jpg",
    about: "avance/02-about.jpg",
    realisations: ["avance/03-realisation-revision-complete-citadine.jpg","avance/04-realisation-freins-avant-suv.jpg","avance/05-realisation-distribution-diesel.jpg","avance/06-realisation-climatisation-rechargee.jpg","avance/07-realisation-preparation-controle-technique.jpg","avance/08-realisation-embrayage-utilitaire.jpg"],
  },
  pro: {
    hero: "pro/01-hero.jpg",
    about: "pro/02-about.jpg",
    before: "pro/03-before-revision-complete-citadine.jpg",
    after: "pro/04-after-revision-complete-citadine.jpg",
    realisations: ["pro/05-realisation-revision-complete-citadine.jpg","pro/06-realisation-freins-avant-suv.jpg","pro/07-realisation-distribution-diesel.jpg","pro/08-realisation-climatisation-rechargee.jpg","pro/09-realisation-preparation-controle-technique.jpg","pro/10-realisation-embrayage-utilitaire.jpg"],
    services: ["pro/11-service-revision-et-vidange.jpg","pro/12-service-freinage.jpg","pro/13-service-distribution-et-embrayage.jpg","pro/14-service-diagnostic-electronique.jpg","pro/15-service-pneumatiques.jpg"],
  },
} as const satisfies TradeMediaManifest;
