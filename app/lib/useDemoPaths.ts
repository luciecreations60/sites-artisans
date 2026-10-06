import { useProspectDemo } from "~/lib/ProspectDemoContext";

/** Préfixe de route pour les liens internes des templates (standard ou prospect). */
export function useDemoBasePath(tradeSlug: string): string {
  const prospect = useProspectDemo();
  if (prospect) return `/demo/${prospect.demo.public_slug}`;
  return `/demos/${tradeSlug}`;
}

/** Conserve ?preview=1 uniquement en aperçu admin. */
export function useDemoSearch(): string {
  const prospect = useProspectDemo();
  return prospect?.isPreview ? "?preview=1" : "";
}

export function useDemoHref(tradeSlug: string, pathAfterBase: string): string {
  const base = useDemoBasePath(tradeSlug);
  const q = useDemoSearch();
  const rest = pathAfterBase.startsWith("/") ? pathAfterBase : `/${pathAfterBase}`;
  return `${base}${rest}${q}`;
}
