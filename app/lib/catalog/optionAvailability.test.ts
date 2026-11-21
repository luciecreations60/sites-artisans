/**
 * Classification options — règles formule + commercial_kind.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getStaticPublicCatalog, STATIC_PLAN_FEATURES } from "../../data/catalog/staticCatalog.ts";
import { classifyOption } from "./optionAvailability.ts";

const catalog = getStaticPublicCatalog();

describe("classifyOption", () => {
  it("Essentiel a des inclusions et des options (plus d’unavailable démo)", () => {
    const inc = STATIC_PLAN_FEATURES.filter(
      (l) => l.planId === "essentiel" && l.inclusion === "included",
    );
    const optional = STATIC_PLAN_FEATURES.filter(
      (l) => l.planId === "essentiel" && l.inclusion === "optional",
    );
    const blocked = STATIC_PLAN_FEATURES.filter(
      (l) => l.planId === "essentiel" && l.inclusion === "unavailable",
    );
    assert.ok(inc.length > 0);
    assert.ok(optional.some((l) => l.featureId === "estimator"));
    assert.ok(optional.some((l) => l.featureId === "quote_form"));
    assert.equal(blocked.length, 0);
  });

  it("quote_form optional tarifé sur Essentiel → sélectionnable", () => {
    const av = classifyOption(catalog, "essentiel", "quote_form");
    assert.equal(av.kind, "optional_priced");
    assert.equal(av.selectable, true);
  });

  it("booking_external optional tarifé sur Essentiel → sélectionnable", () => {
    const av = classifyOption(catalog, "essentiel", "booking_external");
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
