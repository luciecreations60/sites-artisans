import type { OfferTier, TradeData, TradeImage } from "~/data/types";
import { publicUrl } from "~/lib/publicUrl";

function img(slug: string, name: string, alt: string): TradeImage {
  return { src: publicUrl(`img/${slug}/${name}.jpg`), alt };
}

/**
 * Fichiers attendus dans public/img/{métier}/ :
 *
 * essentiel_1  hero
 * essentiel_2  à propos / atelier
 * essentiel_3…5  réalisations 1…3
 *
 * avance_1  hero
 * avance_2  image secondaire
 * avance_3…8  réalisations 1…6
 *
 * pro_1  hero
 * pro_2  avant (projet 1)
 * pro_3  après (projet 1)
 * pro_4…9  réalisations 1…6
 */
export function applyTierMedia(trade: TradeData, tier: OfferTier): TradeData {
  const { slug } = trade;

  if (tier === "essentiel") {
    const projects = trade.projects.slice(0, 3).map((p, i) => ({
      ...p,
      image: img(slug, `essentiel_${i + 3}`, p.title),
      before: undefined,
      after: undefined,
    }));
    return {
      ...trade,
      hero: img(slug, "essentiel_1", `${trade.label} — ${trade.specialty}`),
      atelier: img(slug, "essentiel_2", `Atelier ${trade.label.toLowerCase()}`),
      portrait: img(slug, "essentiel_2", `Portrait ${trade.label.toLowerCase()}`),
      projects,
    };
  }

  if (tier === "avance") {
    return {
      ...trade,
      hero: img(slug, "avance_1", `${trade.label} — ${trade.specialty}`),
      atelier: img(slug, "avance_2", `Atelier ${trade.label.toLowerCase()}`),
      portrait: img(slug, "avance_2", `Portrait ${trade.label.toLowerCase()}`),
      projects: trade.projects.map((p, i) => ({
        ...p,
        image: img(slug, `avance_${i + 3}`, p.title),
        before: undefined,
        after: undefined,
      })),
    };
  }

  return {
    ...trade,
    hero: img(slug, "pro_1", `${trade.label} — ${trade.specialty}`),
    atelier: img(slug, "pro_1", `Atelier ${trade.label.toLowerCase()}`),
    portrait: img(slug, "pro_1", `Portrait ${trade.label.toLowerCase()}`),
    projects: trade.projects.map((p, i) => {
      const image = img(slug, `pro_${i + 4}`, p.title);
      if (i === 0) {
        return {
          ...p,
          image,
          before: img(slug, "pro_2", `Avant — ${p.title}`),
          after: img(slug, "pro_3", `Après — ${p.title}`),
        };
      }
      return { ...p, image, before: undefined, after: undefined };
    }),
  };
}

/** Remap default trade images (hub démos) vers avance_* */
export function withDefaultMedia(trade: TradeData): TradeData {
  return applyTierMedia(trade, "avance");
}

export function switchDemoTier(
  pathname: string,
  slug: string,
  from: OfferTier,
  to: OfferTier,
): string {
  const base = `/demos/${slug}`;
  if (to === "essentiel") return `${base}/essentiel`;

  const prefix = `${base}/${from}`;
  let rest = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : "";

  if (from === "essentiel") return `${base}/${to}`;

  // Fiche projet Pro → liste réalisations sur Avancé
  if (rest.startsWith("/realisations/")) rest = "/realisations";

  return `${base}/${to}${rest || ""}`;
}
