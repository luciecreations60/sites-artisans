import type { TradeSlug } from "../types";
import type { TradeMediaManifest } from "./mediaTypes";
import { bienetreMedia } from "./bienetre.media";
import { boulangerMedia } from "./boulanger.media";
import { coiffureMedia } from "./coiffure.media";
import { cordonnierMedia } from "./cordonnier.media";
import { couvreurMedia } from "./couvreur.media";
import { electricienMedia } from "./electricien.media";
import { garageMedia } from "./garage.media";
import { paysagisteMedia } from "./paysagiste.media";
import { peintreMedia } from "./peintre.media";
import { plombierMedia } from "./plombier.media";
import { serrurierMedia } from "./serrurier.media";

export const tradeMedia = {
  bienetre: bienetreMedia,
  boulanger: boulangerMedia,
  coiffure: coiffureMedia,
  cordonnier: cordonnierMedia,
  couvreur: couvreurMedia,
  electricien: electricienMedia,
  garage: garageMedia,
  paysagiste: paysagisteMedia,
  peintre: peintreMedia,
  plombier: plombierMedia,
  serrurier: serrurierMedia,
} as const satisfies Partial<Record<TradeSlug, TradeMediaManifest>>;

export function getTradeMedia(slug: string): TradeMediaManifest | undefined {
  return tradeMedia[slug as TradeSlug];
}
