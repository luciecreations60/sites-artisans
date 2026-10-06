import type { OfferTier } from "~/data/types";
import type { CrmRef } from "~/lib/crm.types";

export type ProspectDemoStatus = CrmRef & {
  is_system: boolean;
};

export type ProspectDemo = {
  id: string;
  prospect_id: string;
  status_id: string;
  public_slug: string;
  trade_slug: string;
  enabled_offer_tiers: OfferTier[];
  is_primary: boolean;
  company_name: string;
  commercial_name: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  specialty: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  service_area: string | null;
  custom_tagline: string | null;
  custom_intro: string | null;
  theme_id: string;
  font_id: string;
  published_at: string | null;
  shared_at: string | null;
  disabled_at: string | null;
  expires_at: string | null;
  view_count: number;
  last_viewed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/** Payload RPC publique — colonnes affichables uniquement. */
export type PublicProspectDemo = {
  public_slug: string;
  trade_slug: string;
  enabled_offer_tiers: OfferTier[];
  company_name: string;
  commercial_name: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  specialty: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  custom_tagline: string | null;
  custom_intro: string | null;
  theme_id: string;
  font_id: string;
  status_code: string;
};

export const PROSPECT_DEMO_STATUS_CODES = [
  "draft",
  "ready",
  "published",
  "shared",
  "disabled",
] as const;

export type ProspectDemoStatusCode = (typeof PROSPECT_DEMO_STATUS_CODES)[number];

export const PUBLIC_DEMO_STATUS_CODES: ProspectDemoStatusCode[] = ["published", "shared"];
