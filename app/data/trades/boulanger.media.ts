import type { TradeMediaManifest } from "./mediaTypes";

/** Manifest média — boulanger (chemins relatifs à public/img/boulanger/) */
export const boulangerMedia = {
  essentiel: {
    hero: "essentiel/01-hero.jpg",
    about: "essentiel/02-about.jpg",
    realisations: ["essentiel/03-realisation-miche-levain-48-h.jpg","essentiel/04-realisation-buffet-petit-dejeuner-entreprise.jpg","essentiel/05-realisation-gateau-mariage-piece-montee.jpg"],
  },
  avance: {
    hero: "avance/01-hero.jpg",
    about: "avance/02-about.jpg",
    realisations: ["avance/03-realisation-miche-levain-48-h.jpg","avance/04-realisation-buffet-petit-dejeuner-entreprise.jpg","avance/05-realisation-gateau-mariage-piece-montee.jpg","avance/06-realisation-farandole-viennoiseries.jpg","avance/07-realisation-pain-sans-gluten-du-jeudi.jpg","avance/08-realisation-buche-de-noel-artisanale.jpg"],
  },
  pro: {
    hero: "pro/01-hero.jpg",
    about: "pro/02-about.jpg",
    before: "pro/03-before-miche-levain-48-h.jpg",
    after: "pro/04-after-miche-levain-48-h.jpg",
    realisations: ["pro/05-realisation-miche-levain-48-h.jpg","pro/06-realisation-buffet-petit-dejeuner-entreprise.jpg","pro/07-realisation-gateau-mariage-piece-montee.jpg","pro/08-realisation-farandole-viennoiseries.jpg","pro/09-realisation-pain-sans-gluten-du-jeudi.jpg","pro/10-realisation-buche-de-noel-artisanale.jpg"],
    services: ["pro/11-service-pain-au-levain.jpg","pro/12-service-viennoiseries.jpg","pro/13-service-patisseries-individuelles.jpg","pro/14-service-gateaux-sur-commande.jpg","pro/15-service-snacking-sale.jpg"],
  },
} as const satisfies TradeMediaManifest;
