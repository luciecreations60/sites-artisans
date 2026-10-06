import type { TradeMediaManifest } from "./mediaTypes";

/** Manifest média — peintre (chemins relatifs à public/img/peintre/) */
export const peintreMedia = {
  essentiel: {
    hero: "essentiel/01-hero.jpg",
    about: "essentiel/02-about.jpg",
    realisations: ["essentiel/03-realisation-appartement-t4-renove.jpg","essentiel/04-realisation-facade-claire-ravalee.jpg","essentiel/05-realisation-salon-papier-panoramique.jpg"],
  },
  avance: {
    hero: "avance/01-hero.jpg",
    about: "avance/02-about.jpg",
    realisations: ["avance/03-realisation-appartement-t4-renove.jpg","avance/04-realisation-facade-claire-ravalee.jpg","avance/05-realisation-salon-papier-panoramique.jpg","avance/06-realisation-bureaux-open-space.jpg","avance/07-realisation-maison-neuve-finitions.jpg","avance/08-realisation-murs-bleus-piece-a-vivre.jpg"],
  },
  pro: {
    hero: "pro/01-hero.jpg",
    about: "pro/02-about.jpg",
    before: "pro/03-before-appartement-t4-renove.jpg",
    after: "pro/04-after-appartement-t4-renove.jpg",
    realisations: ["pro/05-realisation-appartement-t4-renove.jpg","pro/06-realisation-facade-claire-ravalee.jpg","pro/07-realisation-salon-papier-panoramique.jpg","pro/08-realisation-bureaux-open-space.jpg","pro/09-realisation-maison-neuve-finitions.jpg","pro/10-realisation-murs-bleus-piece-a-vivre.jpg"],
    services: ["pro/11-service-peinture-interieure.jpg","pro/12-service-ravalement-de-facade.jpg","pro/13-service-pose-de-papier-peint.jpg","pro/14-service-laque-boiseries.jpg","pro/15-service-enduit-decoratif.jpg"],
  },
} as const satisfies TradeMediaManifest;
