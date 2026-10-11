/**
 * Contrats disponibilité options — alignés sur optionAvailability.ts
 * (évite d’importer le module app sous node:test / alias).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getStaticPublicCatalog, STATIC_PLAN_FEATURES } from "../../data/catalog/staticCatalog.ts";

const catalog = getStaticPublicCatalog();

describe("disponibilité options (catalogue)", () => {
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

  it("le catalogue public expose les features pour classification", () => {
    assert.ok(catalog.features.length > 0);
    assert.equal(catalog.source, "static");
  });
});
