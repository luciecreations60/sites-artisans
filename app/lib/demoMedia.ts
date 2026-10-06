import type { OfferTier, TradeData, TradeImage } from "~/data/types";
import { getTradeMedia } from "~/data/trades/media";
import type { TradeMediaManifest } from "~/data/trades/mediaTypes";
import { publicUrl } from "~/lib/publicUrl";

function img(slug: string, relativePath: string, alt: string): TradeImage {
  const clean = relativePath.replace(/^\//, "").replace(/\.jpg$/i, "");
  const withExt = relativePath.includes(".")
    ? relativePath.replace(/^\//, "")
    : `${clean}.jpg`;
  return { src: publicUrl(`img/${slug}/${withExt}`), alt };
}

function applyPackMedia(
  trade: TradeData,
  tier: OfferTier,
  pack: TradeMediaManifest[OfferTier],
): TradeData {
  const projectsBase =
    tier === "essentiel" ? trade.projects.slice(0, pack.realisations.length) : trade.projects;

  const projects = projectsBase.map((p, i) => {
    const image = img(trade.slug, pack.realisations[i] ?? pack.realisations[0], p.title);
    if (tier === "pro" && i === 0 && pack.before && pack.after) {
      return {
        ...p,
        image,
        before: img(trade.slug, pack.before, `Avant — ${p.title}`),
        after: img(trade.slug, pack.after, `Après — ${p.title}`),
      };
    }
    return { ...p, image, before: undefined, after: undefined };
  });

  return {
    ...trade,
    hero: img(trade.slug, pack.hero, `${trade.label} — ${trade.specialty}`),
    atelier: img(trade.slug, pack.about, `Atelier ${trade.label.toLowerCase()}`),
    portrait: img(trade.slug, pack.about, `Portrait ${trade.label.toLowerCase()}`),
    projects,
  };
}

/**
 * Modèle unique : public/img/{métier}/{essentiel|avance|pro}/NN-role.jpg
 * Manifests dans app/data/trades/*.media.ts
 */
export function applyTierMedia(trade: TradeData, tier: OfferTier): TradeData {
  const manifest = getTradeMedia(trade.slug);
  if (!manifest) {
    throw new Error(`Manifest média manquant pour le métier « ${trade.slug} »`);
  }
  return applyPackMedia(trade, tier, manifest[tier]);
}

/** Image de service Pro (pro/11-service-…). */
export function getServiceImage(trade: TradeData, index: number): TradeImage {
  const services = getTradeMedia(trade.slug)?.pro.services;
  const title = trade.services[index]?.title ?? `Service ${index + 1}`;
  const path = services?.[index] ?? services?.[0];
  if (!path) {
    throw new Error(`Pas d'image service pour ${trade.slug} #${index}`);
  }
  return img(trade.slug, path, title);
}

export function withDefaultMedia(trade: TradeData): TradeData {
  return applyTierMedia(trade, "avance");
}

export function switchDemoTier(
  pathname: string,
  slug: string,
  from: OfferTier,
  to: OfferTier,
  basePrefix: "/demos" | "/demo" = "/demos",
): string {
  const base = `${basePrefix}/${slug}`;
  if (to === "essentiel") return `${base}/essentiel`;

  const prefix = `${base}/${from}`;
  let rest = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : "";

  if (from === "essentiel") return `${base}/${to}`;

  if (rest.startsWith("/realisations/")) rest = "/realisations";

  return `${base}/${to}${rest || ""}`;
}
