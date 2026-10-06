import type { TradeMediaManifest } from "./mediaTypes";

/** Manifest média — plombier (chemins relatifs à public/img/plombier/) */
export const plombierMedia = {
  essentiel: {
    hero: "essentiel/01-hero.jpg",
    about: "essentiel/02-about.jpg",
    realisations: ["essentiel/03-realisation-renovation-salle-de-bain.jpg","essentiel/04-realisation-douche-et-robinetterie-neuves.jpg","essentiel/05-realisation-douche-a-l-italienne.jpg"],
  },
  avance: {
    hero: "avance/01-hero.jpg",
    about: "avance/02-about.jpg",
    realisations: ["avance/03-realisation-renovation-salle-de-bain.jpg","avance/04-realisation-douche-et-robinetterie-neuves.jpg","avance/05-realisation-douche-a-l-italienne.jpg","avance/06-realisation-remise-en-etat-point-d-eau.jpg","avance/07-realisation-salle-d-eau-pmr.jpg","avance/08-realisation-cuisine-equipee-raccordee.jpg"],
  },
  pro: {
    hero: "pro/01-hero.jpg",
    about: "pro/02-about.jpg",
    before: "pro/03-before-renovation-salle-de-bain.jpg",
    after: "pro/04-after-renovation-salle-de-bain.jpg",
    realisations: ["pro/05-realisation-renovation-salle-de-bain.jpg","pro/06-realisation-douche-et-robinetterie-neuves.jpg","pro/07-realisation-douche-a-l-italienne.jpg","pro/08-realisation-remise-en-etat-point-d-eau.jpg","pro/09-realisation-salle-d-eau-pmr.jpg","pro/10-realisation-cuisine-equipee-raccordee.jpg"],
    services: ["pro/11-service-depannage-fuite-et-debouchage.jpg","pro/12-service-salle-de-bain-complete.jpg","pro/13-service-chauffe-eau-et-ballon-thermodynamiqu.jpg","pro/14-service-chaudiere-gaz-ou-pompe-a-chaleur.jpg","pro/15-service-raccordements-cuisine.jpg"],
  },
} as const satisfies TradeMediaManifest;
