import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getStaticPublicCatalog } from "../../data/catalog/staticCatalog.ts";
import { sanitizeDesiredFeatureIds } from "./sanitizeSelection.ts";

describe("sanitizeDesiredFeatureIds", () => {
  const catalog = getStaticPublicCatalog();

  it("retire quote_form sur Essentiel (unavailable)", () => {
    const next = sanitizeDesiredFeatureIds(catalog, "essentiel", [
      "booking_external",
      "quote_form",
      "contact_form",
    ]);
    assert.ok(!next.includes("quote_form"));
  });

  it("conserve booking_external optional sur Essentiel", () => {
    const next = sanitizeDesiredFeatureIds(catalog, "essentiel", ["booking_external"]);
    assert.ok(next.includes("booking_external"));
  });

  it("retire catalog_services included sans association formule", () => {
    const stripped = {
      ...catalog,
      planFeatures: catalog.planFeatures.filter((l) => l.featureId !== "catalog_services"),
      features: catalog.features.map((f) =>
        f.id === "catalog_services"
          ? { ...f, commercialKind: "included" as const, setupPriceCents: null }
          : f,
      ),
    };
    const next = sanitizeDesiredFeatureIds(stripped, "essentiel", ["catalog_services"]);
    assert.ok(!next.includes("catalog_services"));
  });
});
