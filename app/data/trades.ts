import type { TradeData, TradeSlug } from "./types";
import { menuisier } from "./trades/menuisier";
import { plombier } from "./trades/plombier";
import { electricien } from "./trades/electricien";
import { couvreur } from "./trades/couvreur";
import { peintre } from "./trades/peintre";
import { paysagiste } from "./trades/paysagiste";
import { macon } from "./trades/macon";
import { garage } from "./trades/garage";
import { boulanger } from "./trades/boulanger";
import { coiffure } from "./trades/coiffure";
import { bienetre } from "./trades/bienetre";
import { autre } from "./trades/autre";

export const TRADE_SLUGS: TradeSlug[] = [
  "menuisier",
  "plombier",
  "electricien",
  "couvreur",
  "peintre",
  "paysagiste",
  "macon",
  "garage",
  "boulanger",
  "coiffure",
  "bienetre",
  "autre",
];

export const trades: Record<TradeSlug, TradeData> = {
  menuisier,
  plombier,
  electricien,
  couvreur,
  peintre,
  paysagiste,
  macon,
  garage,
  boulanger,
  coiffure,
  bienetre,
  autre,
};

export function getTrade(slug: string): TradeData | undefined {
  return trades[slug as TradeSlug];
}

export function requireTrade(slug: string): TradeData {
  const trade = getTrade(slug);
  if (!trade) throw new Response("Métier introuvable", { status: 404 });
  return trade;
}
