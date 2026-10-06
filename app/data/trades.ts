import type { TradeData, TradeSlug } from "./types";
import { plombier } from "./trades/plombier";
import { electricien } from "./trades/electricien";
import { couvreur } from "./trades/couvreur";
import { peintre } from "./trades/peintre";
import { paysagiste } from "./trades/paysagiste";
import { garage } from "./trades/garage";
import { boulanger } from "./trades/boulanger";
import { coiffure } from "./trades/coiffure";
import { bienetre } from "./trades/bienetre";
import { cordonnier } from "./trades/cordonnier";
import { serrurier } from "./trades/serrurier";

export const TRADE_SLUGS: TradeSlug[] = [
  "plombier",
  "electricien",
  "couvreur",
  "peintre",
  "paysagiste",
  "garage",
  "boulanger",
  "coiffure",
  "bienetre",
  "cordonnier",
  "serrurier",
];

export const trades: Record<TradeSlug, TradeData> = {
  plombier,
  electricien,
  couvreur,
  peintre,
  paysagiste,
  garage,
  boulanger,
  coiffure,
  bienetre,
  cordonnier,
  serrurier,
};

export function getTrade(slug: string): TradeData | undefined {
  return trades[slug as TradeSlug];
}

export function requireTrade(slug: string): TradeData {
  const trade = getTrade(slug);
  if (!trade) throw new Response("Métier introuvable", { status: 404 });
  return trade;
}
