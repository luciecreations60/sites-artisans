import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  crmProductionBlockers,
  mapCrmToProductionJob,
} from "./crmLoader.ts";
import type { QuoteRow, SiteConfigurationRow } from "../commercial/types.ts";

const project = {
  id: "proj-1",
  title: "Dupont Plomberie",
  trade_slug: "plombier",
  offer_tier: "essentiel",
  status: "design",
  client_id: "cli-1",
  domain: "dupont.example",
};

const configuration = {
  id: "cfg-1",
  format_version: 1,
  client_local_id: null,
  trade_slug: "plombier",
  plan_id: "essentiel",
  path: "formula",
  company_name: "Dupont Plomberie",
  city: "Senlis",
  specialty: "Dépannage",
  theme_id: "sage",
  font_id: "classic",
  desired_feature_ids: ["gallery_basic", "contact_form"],
  feature_quantities: {},
  profile_snapshot: { company: "Dupont Plomberie", city: "Senlis" },
  catalog_source: "supabase",
  catalog_fingerprint: "fp",
  pricing_snapshot: null,
  status: "submitted",
  prospect_id: null,
  project_id: "proj-1",
  created_at: "",
  updated_at: "",
} as SiteConfigurationRow;

const acceptedQuote = {
  id: "q-1",
  reference: "D-20261012-000001",
  kind: "issued",
  status: "accepted",
  prospect_id: null,
  project_id: "proj-1",
  configuration_id: "cfg-1",
  commercial_request_id: null,
  trade_slug: "plombier",
  plan_id: "essentiel",
  creation_ht_cents: 49000,
  creation_vat_cents: null,
  creation_ttc_cents: null,
  recurring_cents: 0,
  tax_regime: "franchise",
  vat_rate_bps: null,
  pricing_complete: true,
  lines_snapshot: [],
  pricing_snapshot: {},
  notes: null,
  valid_until: null,
  issued_at: "2026-10-01T00:00:00Z",
  locked: true,
  created_at: "",
} as QuoteRow;

describe("raccord CRM → production", () => {
  it("mappe projet + config + devis accepté", () => {
    const job = mapCrmToProductionJob({
      project,
      client: { id: "cli-1", full_name: "Marie Dupont", company_name: "Dupont Plomberie" },
      configuration,
      acceptedQuote,
    });
    assert.equal(job.projectId, "proj-1");
    assert.equal(job.configurationId, "cfg-1");
    assert.equal(job.config.acceptedQuoteReference, "D-20261012-000001");
    assert.equal(job.isTestFixture, false);
    assert.equal(job.backendAvailable, true);
    assert.deepEqual(crmProductionBlockers(job), []);
  });

  it("bloque sans devis accepté", () => {
    const job = mapCrmToProductionJob({
      project,
      configuration,
      acceptedQuote: { ...acceptedQuote, status: "sent" },
    });
    assert.equal(job.config.acceptedQuoteReference, null);
    assert.ok(crmProductionBlockers(job).some((r) => /devis/i.test(r)));
  });

  it("bloque sans configuration", () => {
    const job = mapCrmToProductionJob({
      project,
      acceptedQuote,
    });
    assert.ok(crmProductionBlockers(job).some((r) => /configuration/i.test(r)));
  });

  it("ne crée pas de second dossier — id dérivé du projet", () => {
    const job = mapCrmToProductionJob({ project, configuration, acceptedQuote });
    assert.equal(job.id, "crm_proj-1");
  });
});
