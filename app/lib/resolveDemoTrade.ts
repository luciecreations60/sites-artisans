import type { TradeData } from "~/data/types";
import { requireTrade } from "~/data/trades";
import { useProspectDemo } from "~/lib/ProspectDemoContext";

/** Trade depuis le loader /demos/:trade, ou depuis le contexte prospect /demo/:slug. */
export function useResolveDemoTrade(loaded: TradeData | null): TradeData {
  const prospect = useProspectDemo();
  if (loaded) return loaded;
  if (prospect?.demo.trade_slug) {
    return requireTrade(prospect.demo.trade_slug);
  }
  throw new Response("Démo introuvable", { status: 404 });
}

export function demoTradeLoader(params: { trade?: string }): { trade: TradeData | null } {
  if (params.trade) return { trade: requireTrade(params.trade) };
  return { trade: null };
}
