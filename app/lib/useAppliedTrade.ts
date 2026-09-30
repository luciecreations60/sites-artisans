import { useEffect, useState } from "react";
import type { TradeData } from "~/data/types";
import {
  PROFILE_UPDATED_EVENT,
  applyProfile,
  loadProfile,
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
