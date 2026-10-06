import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { TradeData } from "~/data/types";
import { useProspectDemo } from "~/lib/ProspectDemoContext";
import {
  PROFILE_UPDATED_EVENT,
  applyProfile,
  loadProfile,
  profileFontFamily,
  type Profile,
} from "~/lib/personalize";

function resolveProfile(override: Profile | null | undefined): Profile | null {
  if (override) return override;
  return loadProfile();
}

export function useAppliedTrade(base: TradeData): TradeData {
  const prospect = useProspectDemo();
  const override = prospect?.profile ?? null;
  const [trade, setTrade] = useState(() => applyProfile(base, resolveProfile(override)));

  useEffect(() => {
    const refresh = () => setTrade(applyProfile(base, resolveProfile(override)));
    refresh();
    // En mode prospect, ignorer le localStorage (source = snapshot démo uniquement).
    if (override) return;
    window.addEventListener(PROFILE_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, refresh);
  }, [base, override]);

  return trade;
}

/** Styles CSS dérivés du profil (police) à fusionner sur le shell démo. */
export function useProfileStyleVars(): CSSProperties {
  const prospect = useProspectDemo();
  const override = prospect?.profile ?? null;
  const [style, setStyle] = useState<CSSProperties>({});

  useEffect(() => {
    const refresh = () => {
      const fonts = profileFontFamily(resolveProfile(override));
      setStyle({
        ...(fonts.display ? { "--font-display": fonts.display } : {}),
        ...(fonts.body ? { "--font-body": fonts.body } : {}),
      } as CSSProperties);
    };
    refresh();
    if (override) return;
    window.addEventListener(PROFILE_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, refresh);
  }, [override]);

  return style;
}
