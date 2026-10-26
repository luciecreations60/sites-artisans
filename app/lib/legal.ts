import { BRAND_EMAIL, BRAND_NAME } from "~/lib/brand";

/**
 * Identité légale Site AZ — soft-launch jusqu’à l’ouverture publique (01/01/2027).
 * Aligner sur `business_settings` (soft-launch). Pas de faux SIRET.
 */
export type LegalIdentity = {
  legalName: string;
  tradeName: string;
  publisherName: string;
  email: string;
  addressLine: string | null;
  postalCode: string | null;
  city: string;
  country: string;
  siret: string | null;
  /** franchise | liable | unknown */
  taxRegime: "franchise" | "liable" | "unknown";
  vatNumber: string | null;
  paymentTerms: string;
  /** false tant que SIRET + adresse postale définitive absents */
  identityComplete: boolean;
  publicLaunchDate: string;
  lastUpdated: string;
  host: {
    name: string;
    details: string;
    address: string;
  };
};

export const LEGAL_IDENTITY: LegalIdentity = {
  legalName: "Site AZ (en cours d’immatriculation)",
  tradeName: BRAND_NAME,
  publisherName: "Lucie Germain",
  email: BRAND_EMAIL,
  addressLine: null,
  postalCode: null,
  city: "Oise",
  country: "France",
  siret: null,
  taxRegime: "franchise",
  vatNumber: null,
  paymentTerms: "Acompte 40 % à la commande, solde à la mise en ligne.",
  identityComplete: false,
  publicLaunchDate: "1er janvier 2027",
  lastUpdated: "26 octobre 2026",
  host: {
    name: "GitHub Pages (GitHub, Inc.)",
    details:
      "Le site public Site AZ est déployé via GitHub Pages. Les données applicatives (espace client, CRM) sont hébergées par Supabase.",
    address: "88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis",
  },
};

export function legalAddressLabel(id: LegalIdentity = LEGAL_IDENTITY): string {
  if (!id.addressLine || !id.postalCode) {
    return `${id.city} (${id.country}) — adresse postale à confirmer à l’immatriculation`;
  }
  return `${id.addressLine}, ${id.postalCode} ${id.city}, ${id.country}`;
}

export function legalSiretLabel(id: LegalIdentity = LEGAL_IDENTITY): string {
  return id.siret?.trim() || "SIRET à communiquer dès l’immatriculation";
}

export function taxRegimeLabel(id: LegalIdentity = LEGAL_IDENTITY): string {
  if (id.taxRegime === "franchise") {
    return "Franchise en base de TVA — TVA non applicable (art. 293 B du CGI), sous réserve du régime définitif à l’immatriculation.";
  }
  if (id.taxRegime === "liable" && id.vatNumber) {
    return `Assujetti à la TVA — n° ${id.vatNumber}`;
  }
  return "Régime de TVA à confirmer.";
}
