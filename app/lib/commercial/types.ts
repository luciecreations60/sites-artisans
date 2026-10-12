import type { OfferTier, TradeSlug } from "~/data/types";
import type { Profile } from "~/lib/personalize";

export type CommercialSubmitPayload = {
  client_request_id: string;
  client_local_id: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  company_name?: string;
  message?: string;
  contact_preference?: "email" | "phone" | "either";
  trade_slug: TradeSlug;
  plan_id: OfferTier;
  path: "formula" | "compose";
  specialty?: string;
  city?: string;
  theme_id?: string;
  font_id?: string;
  desired_feature_ids: string[];
  feature_quantities: Record<string, number>;
  profile_snapshot: Profile;
  client_claimed_creation_cents: number | null;
};

export type CommercialSubmitResult =
  | {
      ok: true;
      already_received: boolean;
      tracking_code: string;
      request_id: string;
      prospect_id: string;
      configuration_id: string;
      server_creation_cents: number;
      server_recurring_cents: number;
      pricing_complete: boolean;
      price_differs_from_client: boolean;
      tax: {
        vatRateBps: number | null;
        creationHtCents: number;
        creationVatCents: number | null;
        creationTtcCents: number | null;
      };
      warnings: string[];
    }
  | {
      ok: false;
      error: string;
      code?: "migration_pending" | "catalog_error" | "catalog_empty" | "crm_refs" | string;
      status?: number;
    };

export type SiteConfigurationRow = {
  id: string;
  format_version: number;
  client_local_id: string | null;
  trade_slug: string | null;
  plan_id: string | null;
  path: string | null;
  company_name: string | null;
  city: string | null;
  specialty: string | null;
  theme_id: string | null;
  font_id: string | null;
  desired_feature_ids: string[];
  feature_quantities: Record<string, number>;
  profile_snapshot: Record<string, unknown>;
  catalog_source: string;
  catalog_fingerprint: string | null;
  pricing_snapshot: Record<string, unknown> | null;
  status: string;
  prospect_id: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CommercialRequestRow = {
  id: string;
  tracking_code: string;
  prospect_id: string;
  configuration_id: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  company_name: string | null;
  message: string | null;
  contact_preference: string | null;
  source_code: string;
  server_creation_cents: number | null;
  server_recurring_cents: number | null;
  server_pricing_complete: boolean;
  server_pricing_snapshot: Record<string, unknown> | null;
  client_claimed_creation_cents: number | null;
  price_differs_from_client: boolean;
  status: string;
  anonymized_at?: string | null;
  created_at: string;
};

export type QuoteRow = {
  id: string;
  reference: string | null;
  kind: "simulation" | "draft" | "issued";
  status: string;
  prospect_id: string | null;
  project_id: string | null;
  configuration_id: string | null;
  commercial_request_id: string | null;
  trade_slug: string | null;
  plan_id: string | null;
  creation_ht_cents: number;
  creation_vat_cents: number | null;
  creation_ttc_cents: number | null;
  recurring_cents: number;
  tax_regime: string;
  vat_rate_bps: number | null;
  pricing_complete: boolean;
  lines_snapshot: unknown[];
  pricing_snapshot: Record<string, unknown>;
  notes: string | null;
  valid_until: string | null;
  issued_at: string | null;
  locked: boolean;
  created_at: string;
};
