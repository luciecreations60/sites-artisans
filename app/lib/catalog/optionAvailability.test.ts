/**
 * Classification options — règles formule + commercial_kind.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getStaticPublicCatalog, STATIC_PLAN_FEATURES } from "../../data/catalog/staticCatalog.ts";
import { classifyOption } from "./optionAvailability.ts";

const catalog = getStaticPublicCatalog();

describe("classifyOption", () => {
  it("Essentiel a des inclusions et des unavailable", () => {
    const inc = STATIC_PLAN_FEATURES.filter(
      (l) => l.planId === "essentiel" && l.inclusion === "included",
    );
    const blocked = STATIC_PLAN_FEATURES.filter(
      (l) => l.planId === "essentiel" && l.inclusion === "unavailable",
    );
    assert.ok(inc.length > 0);
    assert.ok(blocked.length > 0);
    assert.ok(blocked.some((l) => l.featureId === "estimator"));
  });

  it("quote_form unavailable sur Essentiel → non sélectionnable", () => {
    const av = classifyOption(catalog, "essentiel", "quote_form");
    assert.equal(av.kind, "incompatible");
    assert.equal(av.selectable, false);
  });

  it("booking_external optional sur Essentiel → sélectionnable (STATIC externe)", () => {
    const av = classifyOption(catalog, "essentiel", "booking_external");
    assert.equal(av.selectable, true);
  });

  it("booking_external tarifé Supabase-like → optional_priced", () => {
    const enriched = {
      ...catalog,
      features: catalog.features.map((f) =>
        f.id === "booking_external"
          ? {
              ...f,
              setupPriceCents: 4000,
              billingType: "setup" as const,
              commercialKind: "optional_priced" as const,
              externalProviderId: "calendly",
            }
          : f,
      ),
    };
    const av = classifyOption(enriched, "essentiel", "booking_external");
    assert.equal(av.kind, "optional_priced");
    assert.equal(av.selectable, true);
  });

  it("catalog_services included sans lien formule → non sélectionnable", () => {
    const enriched = {
      ...catalog,
      planFeatures: catalog.planFeatures.filter((l) => l.featureId !== "catalog_services"),
      features: catalog.features.map((f) =>
        f.id === "catalog_services"
          ? {
              ...f,
              commercialKind: "included" as const,
              setupPriceCents: null,
              billingType: "none" as const,
            }
          : f,
      ),
    };
    const av = classifyOption(enriched, "essentiel", "catalog_services");
    assert.equal(av.selectable, false);
    assert.equal(av.kind, "unavailable");
  });
});
