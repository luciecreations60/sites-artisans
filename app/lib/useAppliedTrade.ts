import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { TradeData } from "~/data/types";
import {
  PROFILE_UPDATED_EVENT,
  applyProfile,
  loadProfile,
  profileFontFamily,
} from "~/lib/personalize";

export function useAppliedTrade(base: TradeData): TradeData {
  const [trade, setTrade] = useState(() => applyProfile(base, loadProfile()));

  useEffect(() => {
    const refresh = () => setTrade(applyProfile(base, loadProfile()));
    refresh();
    window.addEventListener(PROFILE_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, refresh);
  }, [base]);

  return trade;
}

/** Styles CSS dérivés du profil (police) à fusionner sur le shell démo. */
export function useProfileStyleVars(): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({});

  useEffect(() => {
    const refresh = () => {
      const fonts = profileFontFamily(loadProfile());
      setStyle({
        ...(fonts.display ? { "--font-display": fonts.display } : {}),
        ...(fonts.body ? { "--font-body": fonts.body } : {}),
      } as CSSProperties);
    };
    refresh();
    window.addEventListener(PROFILE_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, refresh);
  }, []);

  return style;
}
