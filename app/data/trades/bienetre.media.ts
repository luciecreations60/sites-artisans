/**
 * Manifest média Bien-être — modèle de référence pour les autres métiers.
 * Chemins relatifs à public/img/bienetre/
 */
import type { TradeMediaManifest } from "./mediaTypes";

export const bienetreMedia = {
  essentiel: {
    hero: "essentiel/01-hero.jpg",
    about: "essentiel/02-about.jpg",
    realisations: [
      "essentiel/03-realisation-pierres-chaudes.jpg",
      "essentiel/04-realisation-soin-visage.jpg",
      "essentiel/05-realisation-forfait-mariee.jpg",
    ],
  },
  avance: {
    hero: "avance/01-hero.jpg",
    about: "avance/02-about.jpg",
    realisations: [
      "avance/03-realisation-pierres-chaudes.jpg",
      "avance/04-realisation-soin-visage.jpg",
      "avance/05-realisation-forfait-mariee.jpg",
      "avance/06-realisation-reflexologie.jpg",
      "avance/07-realisation-gommage.jpg",
      "avance/08-realisation-atelier-entreprise.jpg",
    ],
  },
  pro: {
    hero: "pro/01-hero.jpg",
    about: "pro/02-about.jpg",
    before: "pro/03-before-pierres-chaudes.jpg",
    after: "pro/04-after-pierres-chaudes.jpg",
    realisations: [
      "pro/05-realisation-pierres-chaudes.jpg",
      "pro/06-realisation-soin-visage.jpg",
      "pro/07-realisation-forfait-mariee.jpg",
      "pro/08-realisation-reflexologie.jpg",
      "pro/09-realisation-gommage.jpg",
      "pro/10-realisation-atelier-entreprise.jpg",
    ],
    services: [
      "pro/11-service-massage-relaxant.jpg",
      "pro/12-service-soin-visage.jpg",
      "pro/13-service-epilation.jpg",
      "pro/14-service-manucure.jpg",
      "pro/15-service-rituel-duo.jpg",
    ],
  },
} as const satisfies TradeMediaManifest;
