import { useMemo, useSyncExternalStore } from "react";
import type { OfferTier } from "~/data/types";
import { CONFIG_STORAGE_KEY } from "~/lib/configurator/types";
import { resolveDemoModules, type DemoModules } from "./demoModules";

function subscribe(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener("sa-profile-updated", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("sa-profile-updated", handler);
  };
}

function getSnapshot(tier: OfferTier): string {
  try {
    return `${tier}:${localStorage.getItem(CONFIG_STORAGE_KEY) ?? ""}`;
  } catch {
    return tier;
  }
}

export function useDemoModules(tier: OfferTier): DemoModules {
  const snap = useSyncExternalStore(
    subscribe,
    () => getSnapshot(tier),
    () => tier,
  );
  return useMemo(() => resolveDemoModules(tier), [tier, snap]);
}
