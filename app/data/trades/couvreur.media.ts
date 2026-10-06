import type { TradeMediaManifest } from "./mediaTypes";

/** Manifest média — couvreur (chemins relatifs à public/img/couvreur/) */
export const couvreurMedia = {
  essentiel: {
    hero: "essentiel/01-hero.jpg",
    about: "essentiel/02-about.jpg",
    realisations: ["essentiel/03-realisation-toiture-tuiles-mecaniques.jpg","essentiel/04-realisation-ardoises-naturelles-bretonne.jpg","essentiel/05-realisation-lucarne-et-chatiere.jpg"],
  },
  avance: {
    hero: "avance/01-hero.jpg",
    about: "avance/02-about.jpg",
    realisations: ["avance/03-realisation-toiture-tuiles-mecaniques.jpg","avance/04-realisation-ardoises-naturelles-bretonne.jpg","avance/05-realisation-lucarne-et-chatiere.jpg","avance/06-realisation-gouttieres-zinc-neuf.jpg","avance/07-realisation-reparation-apres-tempete.jpg","avance/08-realisation-charpente-renfort-fermette.jpg"],
  },
  pro: {
    hero: "pro/01-hero.jpg",
    about: "pro/02-about.jpg",
    before: "pro/03-before-toiture-tuiles-mecaniques.jpg",
    after: "pro/04-after-toiture-tuiles-mecaniques.jpg",
    realisations: ["pro/05-realisation-toiture-tuiles-mecaniques.jpg","pro/06-realisation-ardoises-naturelles-bretonne.jpg","pro/07-realisation-lucarne-et-chatiere.jpg","pro/08-realisation-gouttieres-zinc-neuf.jpg","pro/09-realisation-reparation-apres-tempete.jpg","pro/10-realisation-charpente-renfort-fermette.jpg"],
    services: ["pro/11-service-reparation-de-toiture.jpg","pro/12-service-refection-complete-toiture.jpg","pro/13-service-zinguerie-et-gouttieres.jpg","pro/14-service-isolation-combles-par-l-exterieur.jpg","pro/15-service-demoussage-et-hydrofuge.jpg"],
  },
} as const satisfies TradeMediaManifest;
