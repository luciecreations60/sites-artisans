import type { OfferTier } from "~/data/types";
import type { PublicCatalog } from "~/data/catalog/types";
import { classifyOption } from "./optionAvailability.ts";

/**
 * Retire les options non sélectionnables pour la formule courante
 * (ex. quote_form unavailable sur Essentiel, catalog_services sans règle).
 * À appeler après chargement localStorage / changement de formule.
 */
export function sanitizeDesiredFeatureIds(
  catalog: PublicCatalog,
  planId: OfferTier | null,
  desiredFeatureIds: string[],
): string[] {
  if (!planId) return [...new Set(desiredFeatureIds)];
  return [...new Set(desiredFeatureIds)].filter((id) => {
    const av = classifyOption(catalog, planId, id);
    return av.selectable || av.kind === "included";
  });
}

export function sanitizeFeatureQuantities(
  desiredFeatureIds: string[],
  quantities: Record<string, number> | undefined,
): Record<string, number> {
  if (!quantities) return {};
  const allowed = new Set(desiredFeatureIds);
  return Object.fromEntries(
    Object.entries(quantities).filter(
      ([id, qty]) => allowed.has(id) && typeof qty === "number" && qty > 0,
    ),
  );
}
