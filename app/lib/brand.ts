/** Identité produit — planche Site AZ (soft-launch → ouverture 01/01/2027). */
export const BRAND_NAME = "Site AZ";
export const BRAND_TAGLINE = "Sites web pour artisans";
export const BRAND_TAGLINE_SHORT = "Simples · Élégants · Efficaces";
export const BRAND_EMAIL = "contact@site-az.fr";
export const BRAND_TITLE = `${BRAND_NAME} — ${BRAND_TAGLINE}`;

/** Couleurs planche (alignées sur `app.css` :root). */
export const BRAND_COLORS = {
  ink: "#1f2a27",
  sage: "#5f8f82",
  sageDeep: "#4a7368",
  sageSoft: "#dceae5",
  paper: "#f5f3ef",
} as const;

export function brandTitle(page: string): string {
  return `${page} — ${BRAND_NAME}`;
}
