import { createContext, useContext, type ReactNode } from "react";
import type { OfferTier } from "~/data/types";
import type { PublicProspectDemo } from "~/lib/prospectDemo.types";
import { normalizeOfferTiers, prospectDemoToProfile, type ProspectDemoProfile } from "~/lib/prospectDemo";

export type ProspectDemoMode = {
  /** Payload public (RPC) ou projection admin pour preview. */
  demo: PublicProspectDemo;
  /** true = session admin + lecture RLS ; ne doit jamais tracker les vues. */
  isPreview: boolean;
  profile: ProspectDemoProfile;
  enabledTiers: OfferTier[];
};

const ProspectDemoCtx = createContext<ProspectDemoMode | null>(null);

export function ProspectDemoProvider({
  demo,
  isPreview,
  children,
}: {
  demo: PublicProspectDemo;
  isPreview: boolean;
  children: ReactNode;
}) {
  const value: ProspectDemoMode = {
    demo,
    isPreview,
    profile: prospectDemoToProfile(demo),
    enabledTiers: normalizeOfferTiers(demo.enabled_offer_tiers),
  };
  return <ProspectDemoCtx.Provider value={value}>{children}</ProspectDemoCtx.Provider>;
}

export function useProspectDemo(): ProspectDemoMode | null {
  return useContext(ProspectDemoCtx);
}
