/** Identité produit (soft-launch → ouverture 01/01/2027). */
export const BRAND_NAME = "Site AZ";
export const BRAND_TAGLINE = "Sites web pour artisans";
export const BRAND_EMAIL = "contact@site-az.fr";
export const BRAND_TITLE = `${BRAND_NAME} — ${BRAND_TAGLINE}`;

export function brandTitle(page: string): string {
  return `${page} — ${BRAND_NAME}`;
}
